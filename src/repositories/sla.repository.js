const { prisma } = require('../config/database');

const slaInclude = {
  category: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      active: true
    }
  }
};

const slaRepository = {
  create(data, tx = prisma) {
    return tx.sla.create({
      data,
      include: slaInclude
    });
  },

  findById(id, tx = prisma) {
    return tx.sla.findUnique({
      where: { id },
      include: slaInclude
    });
  },

  findFirst(where, tx = prisma) {
    return tx.sla.findFirst({
      where,
      orderBy: [
        { version: 'desc' },
        { createdAt: 'desc' }
      ],
      include: slaInclude
    });
  },

  findApplicable({ priority, categoryId, clientId }, tx = prisma) {
    return tx.sla.findMany({
      where: {
        active: true,
        OR: [
          ...(clientId ? [{ clientId }] : []),
          ...(categoryId ? [{ categoryId }] : []),
          ...(priority ? [{ priority }] : [])
        ]
      },
      orderBy: [
        { version: 'desc' },
        { createdAt: 'desc' }
      ],
      include: slaInclude
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.sla.count({ where }),
      prisma.sla.findMany({
        where,
        orderBy,
        skip,
        take,
        include: slaInclude
      })
    ]);
  },

  findHistory(sla) {
    return prisma.sla.findMany({
      where: {
        name: sla.name,
        priority: sla.priority,
        categoryId: sla.categoryId,
        clientId: sla.clientId
      },
      orderBy: [
        { version: 'asc' },
        { createdAt: 'asc' }
      ],
      include: slaInclude
    });
  },

  versionSla(current, data) {
    return prisma.$transaction(async (tx) => {
      await tx.sla.update({
        where: { id: current.id },
        data: { active: false }
      });

      return this.create({
        name: current.name,
        priority: current.priority,
        categoryId: current.categoryId,
        clientId: current.clientId,
        version: current.version + 1,
        maxResponseHours: data.maxResponseHours,
        maxResolutionHours: data.maxResolutionHours,
        active: true
      }, tx);
    });
  },

  deactivate(id) {
    return prisma.sla.update({
      where: { id },
      data: { active: false },
      include: slaInclude
    });
  }
};

module.exports = { slaRepository, slaInclude };
