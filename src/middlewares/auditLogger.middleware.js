const { asyncHandler } = require('../utils/asyncHandler');
const { auditLogRepository } = require('../repositories/auditLog.repository');

const auditLogger = (action, entity) => asyncHandler(async (req, res, next) => {
  await auditLogRepository.create({
    action,
    entity,
    entityId: req.params.id || null,
    userId: req.user?.id || null,
    metadata: {
      method: req.method,
      path: req.originalUrl
    }
  });

  next();
});

module.exports = { auditLogger };
