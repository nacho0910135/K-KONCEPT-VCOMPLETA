const { Prisma } = require('@prisma/client');

const { logger } = require('./logger');

const DEFAULT_RETRY_OPTIONS = {
  retries: 3,
  baseDelayMs: 75,
  maxDelayMs: 750
};

const RETRYABLE_PRISMA_CODES = new Set([
  'P2034',
  'P2028'
]);

const isRetryableTransactionError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_CODES.has(error.code);
  }

  const message = String(error?.message || '').toLowerCase();
  return message.includes('deadlock')
    || message.includes('serialization')
    || message.includes('could not serialize access')
    || message.includes('canceling statement due to lock timeout')
    || message.includes('transaction already closed');
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const withTransactionRetry = async (operation, options = {}) => {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError;

  for (let attempt = 1; attempt <= retryOptions.retries; attempt += 1) {
    try {
      return await operation({ attempt });
    } catch (error) {
      lastError = error;

      if (!isRetryableTransactionError(error) || attempt === retryOptions.retries) {
        throw error;
      }

      const exponentialDelay = retryOptions.baseDelayMs * (2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * retryOptions.baseDelayMs);
      const delayMs = Math.min(exponentialDelay + jitter, retryOptions.maxDelayMs);

      logger.warn({
        attempt,
        retries: retryOptions.retries,
        delayMs,
        errorCode: error.code
      }, 'Reintentando transaccion por contencion concurrente');

      await sleep(delayMs);
    }
  }

  throw lastError;
};

module.exports = {
  withTransactionRetry,
  isRetryableTransactionError
};
