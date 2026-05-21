const { categoryRepository } = require('../repositories/category.repository');
const { subcategoryRepository } = require('../repositories/subcategory.repository');
const { ConflictError, NotFoundError } = require('../utils/errors');

const subcategoryService = {
  async create(categoryId, payload) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Categoria no encontrada');

    const existing = await subcategoryRepository.findByNameAndCategory(payload.name, categoryId);
    if (existing) throw new ConflictError('Ya existe una subcategoria con ese nombre en la categoria');

    return subcategoryRepository.create({
      categoryId,
      name: payload.name,
      description: payload.description || null
    });
  },

  async listByCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Categoria no encontrada');

    return subcategoryRepository.listByCategory(categoryId);
  },

  async update(id, payload) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    if (payload.name && payload.name !== subcategory.name) {
      const existing = await subcategoryRepository.findByNameAndCategory(payload.name, subcategory.categoryId);
      if (existing) throw new ConflictError('Ya existe una subcategoria con ese nombre en la categoria');
    }

    return subcategoryRepository.update(id, {
      name: payload.name,
      description: payload.description || null
    });
  },

  async deactivate(id) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    return subcategoryRepository.update(id, { active: false });
  }
};

module.exports = { subcategoryService };
