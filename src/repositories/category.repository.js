const { prisma } = require('../config/database');

const categoryRepository = {
  create(data) {
    return prisma.category.create({ data });
  },

  findById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { name: 'asc' }
        }
      }
    });
  },

  findByName(name) {
    return prisma.category.findUnique({ where: { name } });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          subcategories: {
            orderBy: { name: 'asc' }
          }
        }
      })
    ]);
  },

  update(id, data) {
    return prisma.category.update({
      where: { id },
      data
    });
  },

  usageCounts(id) {
    return prisma.$transaction([
      prisma.ticket.count({ where: { categoryId: id } }),
      prisma.product.count({ where: { categoryId: id } }),
      prisma.sla.count({ where: { categoryId: id } }),
      prisma.subcategory.count({ where: { categoryId: id, tickets: { some: {} } } })
    ]);
  },

  delete(id) {
    return prisma.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({ where: { categoryId: id } });
      return tx.category.delete({ where: { id } });
    });
  }
};

module.exports = { categoryRepository };
