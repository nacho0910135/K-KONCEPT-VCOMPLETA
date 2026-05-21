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

const auditInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
};

const auditRepository = {
  create(data) {
    return prisma.auditLog.create({ data: normalizeAuditLog(data) });
  },

  createMany(entries) {
    if (entries.length === 0) return { count: 0 };

    return prisma.auditLog.createMany({
      data: entries.map(normalizeAuditLog)
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take,
        include: auditInclude
      })
    ]);
  },

  findById(id) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: auditInclude
    });
  },

  findCorrelated({ userId, createdAt, excludeId, minutes = 5 }) {
    if (!userId || !createdAt) return [];

    const windowMs = minutes * 60 * 1000;
    return prisma.auditLog.findMany({
      where: {
        userId,
        id: { not: excludeId },
        createdAt: {
          gte: new Date(createdAt.getTime() - windowMs),
          lte: new Date(createdAt.getTime() + windowMs)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: auditInclude
    });
  },

  findForExport({ where }) {
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: auditInclude
    });
  }
};

module.exports = { auditRepository, normalizeAuditLog };
