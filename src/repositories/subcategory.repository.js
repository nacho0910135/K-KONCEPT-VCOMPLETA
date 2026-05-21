const { prisma } = require('../config/database');

const subcategoryRepository = {
  create(data) {
    return prisma.subcategory.create({ data });
  },

  findById(id) {
    return prisma.subcategory.findUnique({
      where: { id },
      include: { category: true }
    });
  },

  findByNameAndCategory(name, categoryId) {
    return prisma.subcategory.findUnique({
      where: {
        name_categoryId: {
          name,
          categoryId
        }
      }
    });
  },

  listByCategory(categoryId) {
    return prisma.subcategory.findMany({
      where: {
        categoryId,
        active: true
      },
      orderBy: { name: 'asc' }
    });
  },

  update(id, data) {
    return prisma.subcategory.update({
      where: { id },
      data
    });
  }
};

module.exports = { subcategoryRepository };
