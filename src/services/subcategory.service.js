const { categoryRepository } = require('../repositories/category.repository');
const { subcategoryRepository } = require('../repositories/subcategory.repository');
const { auditService } = require('./audit.service');
const { ConflictError, NotFoundError } = require('../utils/errors');

const subcategoryService = {
  async create(categoryId, payload, actor) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Categoria no encontrada');

    const existing = await subcategoryRepository.findByNameAndCategory(payload.name, categoryId);
    if (existing) throw new ConflictError('Ya existe una subcategoria con ese nombre en la categoria');

    const subcategory = await subcategoryRepository.create({
      categoryId,
      name: payload.name,
      description: payload.description || null
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_CREATED',
      entity: 'Subcategory',
      entityId: subcategory.id,
      newValue: subcategory
    });

    return subcategory;
  },

  async listByCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundError('Categoria no encontrada');

    return subcategoryRepository.listByCategory(categoryId);
  },

  async update(id, payload, actor) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    if (payload.name && payload.name !== subcategory.name) {
      const existing = await subcategoryRepository.findByNameAndCategory(payload.name, subcategory.categoryId);
      if (existing) throw new ConflictError('Ya existe una subcategoria con ese nombre en la categoria');
    }

    const updated = await subcategoryRepository.update(id, {
      name: payload.name,
      description: payload.description || null
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_UPDATED',
      entity: 'Subcategory',
      entityId: id,
      previousValue: subcategory,
      newValue: updated
    });

    return updated;
  },

  async deactivate(id, actor) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    const updated = await subcategoryRepository.update(id, { active: false });

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_DEACTIVATED',
      entity: 'Subcategory',
      entityId: id,
      previousValue: { active: subcategory.active },
      newValue: { active: updated.active }
    });

    return updated;
  }
};

module.exports = { subcategoryService };
