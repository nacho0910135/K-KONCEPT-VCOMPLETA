const { prisma } = require('../config/database');

const normalizeAuditLog = (data) => ({
  action: data.action,
  entity: data.entity,
  entityId: data.entityId || null,
  userId: data.userId || null,
  previousValue: data.previousValue || null,
  newValue: data.newValue || null,
  ipAddress: data.ipAddress || null,
  userAgent: data.userAgent || null,
  result: data.result || 'SUCCESS',
  details: data.details || data.metadata || null
});

const auditLogRepository = {
  create(data) {
    return prisma.auditLog.create({ data: normalizeAuditLog(data) });
  },

  createMany(entries) {
    if (entries.length === 0) return { count: 0 };

    return prisma.auditLog.createMany({
      data: entries.map(normalizeAuditLog)
    });
  }
};

module.exports = { auditLogRepository };
