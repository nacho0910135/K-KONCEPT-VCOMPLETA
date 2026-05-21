const { ForbiddenError } = require('../utils/errors');

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('No tiene permisos para ejecutar esta accion'));
  }

  return next();
};

module.exports = { authorize };
