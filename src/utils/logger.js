const pino = require('pino');
const pinoHttp = require('pino-http');

const { env } = require('../config/env');

const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
});

const httpLogger = pinoHttp({ logger });

module.exports = { logger, httpLogger };
