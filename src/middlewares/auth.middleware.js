const { authRepository } = require('../repositories/auth.repository');
const { ForbiddenError, UnauthorizedError } = require('../utils/errors');
const { verifyAccessToken } = require('../utils/jwt.util');

const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedError('Token de autenticacion requerido');
    }

    const payload = verifyAccessToken(token);
    const user = await authRepository.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    req.user = user;
    req.auth = payload;

    return next();
  } catch (error) {
    return next(error);
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ForbiddenError('No tiene permisos para ejecutar esta accion'));
  }

  return next();
};

module.exports = {
  verifyToken,
  authorizeRoles,
  authenticate: verifyToken,
  authorize: authorizeRoles
};
