const pino = require('pino');
const pinoHttp = require('pino-http');

const { env } = require('../config/env');

const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.refreshToken',
      'req.body.accessToken',
      'req.body.token',
      'res.body.data.accessToken',
      'res.body.data.refreshToken',
      '*.password',
      '*.refreshToken',
      '*.accessToken',
      '*.tokenHash'
    ],
    censor: '[REDACTED]'
  },
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

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort
      };
    }
  }
});

module.exports = { logger, httpLogger };
