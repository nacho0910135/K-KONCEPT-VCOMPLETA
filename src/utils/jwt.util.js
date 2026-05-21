const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { jwtConfig } = require('../config/jwt');
const { UnauthorizedError } = require('./errors');

const signAccessToken = (user) => jwt.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  },
  jwtConfig.secret,
  { expiresIn: jwtConfig.accessExpiresIn }
);

const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, jwtConfig.secret);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Tipo de token invalido');
    }

    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expirado');
    }

    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError('Token invalido');
  }
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseDurationToMs = (duration) => {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(duration);

  if (!match) {
    throw new Error(`Duracion invalida: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit];
};

const getRefreshTokenExpiryDate = () => (
  new Date(Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn))
);

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate
};
