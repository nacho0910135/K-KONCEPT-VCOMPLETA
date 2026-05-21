const { auditService } = require('../services/audit.service');

const auditLog = (action, entityExtractor) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    const extracted = typeof entityExtractor === 'function'
      ? entityExtractor(req, res) || {}
      : { entity: entityExtractor };

    auditService.logEvent({
      userId: req.user?.id || null,
      action,
      entity: extracted.entity || entityExtractor || 'Unknown',
      entityId: extracted.entityId || req.params.id || null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
      details: {
        method: req.method,
        path: req.originalUrl,
        ...extracted.details
      }
    });
  });

  next();
};

module.exports = { auditLog, auditLogger: auditLog };
