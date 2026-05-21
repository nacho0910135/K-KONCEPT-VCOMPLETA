const { prisma } = require('../config/database');

const categoryRepository = {
  create(data) {
    return prisma.category.create({ data });
  },

  findById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: { subcategories: true }
    });
  },

  findByName(name) {
    return prisma.category.findUnique({ where: { name } });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.category.count({ where }),
      prisma.category.findMany({ where, orderBy, skip, take })
    ]);
  },

  update(id, data) {
    return prisma.category.update({
      where: { id },
      data
    });
  }
};

module.exports = { categoryRepository };
