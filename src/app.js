const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const { env } = require('./config/env');
const { httpLogger } = require('./utils/logger');
const { ForbiddenError } = require('./utils/errors');
const { generalRateLimiter, authRateLimiter } = require('./middlewares/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');
const routes = require('./routes');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(compression());
app.use(httpLogger);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ForbiddenError('Origen no permitido por CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(generalRateLimiter);
app.use(`${env.apiPrefix}/auth`, authRateLimiter);
app.use(env.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
