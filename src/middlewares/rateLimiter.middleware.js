const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV !== 'production';

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevelopment ? 2000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente nuevamente mas tarde.',
    errors: []
  }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevelopment ? 200 : 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticacion. Intente nuevamente mas tarde.',
    errors: []
  }
});

module.exports = { generalRateLimiter, authRateLimiter };
