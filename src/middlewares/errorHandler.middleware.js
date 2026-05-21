const { Prisma } = require('@prisma/client');
const multer = require('multer');
const { ZodError } = require('zod');

const { AppError, BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new BadRequestError('Validacion fallida', error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    })));
  }

  if (error instanceof multer.MulterError) {
    return new BadRequestError(error.message);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new BadRequestError('Valor duplicado', [{ target: error.meta?.target }]);
    }

    if (error.code === 'P2025') {
      return new NotFoundError('Registro no encontrado');
    }
  }

  return error;
};

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
  const normalized = normalizeError(error);
  const statusCode = normalized.statusCode || 500;
  const isOperational = normalized.isOperational;

  if (!isOperational || statusCode >= 500) {
    logger.error({ error: normalized, path: req.originalUrl }, 'Error no controlado');
  }

  return res.status(statusCode).json({
    success: false,
    message: isOperational ? normalized.message : 'Error interno del servidor',
    errors: normalized.errors || []
  });
};

module.exports = { errorHandler, notFoundHandler };
