const { prisma } = require('../config/database');

const productInclude = {
  category: true
};

const productRepository = {
  create(data) {
    return prisma.product.create({
      data,
      include: productInclude
    });
  },

  findById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: productInclude
    });
  },

  findBySerialNumber(serialNumber) {
    return prisma.product.findUnique({
      where: { serialNumber },
      include: productInclude
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: productInclude
      })
    ]);
  },

  update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      include: productInclude
    });
  }
};

module.exports = { productRepository };
