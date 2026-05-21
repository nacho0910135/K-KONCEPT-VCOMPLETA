const { prisma } = require('../config/database');

const warrantyInclude = {
  product: {
    include: {
      category: true
    }
  },
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true
    }
  }
};

const warrantyRepository = {
  create(data) {
    return prisma.warranty.create({
      data,
      include: warrantyInclude
    });
  },

  findById(id) {
    return prisma.warranty.findUnique({
      where: { id },
      include: warrantyInclude
    });
  },

  findByProductAndClient({ productId, clientId }) {
    return prisma.warranty.findFirst({
      where: {
        productId,
        clientId
      },
      orderBy: {
        endDate: 'desc'
      },
      include: warrantyInclude
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.warranty.count({ where }),
      prisma.warranty.findMany({
        where,
        orderBy,
        skip,
        take,
        include: warrantyInclude
      })
    ]);
  },

  listByClient(clientId) {
    return prisma.warranty.findMany({
      where: { clientId },
      orderBy: { endDate: 'desc' },
      include: warrantyInclude
    });
  },

  update(id, data) {
    return prisma.warranty.update({
      where: { id },
      data,
      include: warrantyInclude
    });
  },

  delete(id) {
    return prisma.warranty.delete({
      where: { id }
    });
  }
};

module.exports = { warrantyRepository };
