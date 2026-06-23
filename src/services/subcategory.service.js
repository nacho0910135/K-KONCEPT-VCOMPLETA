const { categoryRepository } = require('../repositories/category.repository');
const { subcategoryRepository } = require('../repositories/subcategory.repository');
const { auditService } = require('./audit.service');
const { productService } = require('./product.service');
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

    if (payload.products?.length) {
      await productService.addNamesToSubcategory({ categoryId, subcategoryId: subcategory.id, products: payload.products });
    }

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_CREATED',
      entity: 'Subcategory',
      entityId: subcategory.id,
      newValue: subcategory
    });

    return subcategoryRepository.findById(subcategory.id);
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

    if (payload.products?.length) {
      await productService.addNamesToSubcategory({ categoryId: subcategory.categoryId, subcategoryId: id, products: payload.products });
    }

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_UPDATED',
      entity: 'Subcategory',
      entityId: id,
      previousValue: subcategory,
      newValue: updated
    });

    return subcategoryRepository.findById(updated.id);
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
  },

  async activate(id, actor) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    const updated = await subcategoryRepository.update(id, { active: true });

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_ACTIVATED',
      entity: 'Subcategory',
      entityId: id,
      previousValue: { active: subcategory.active },
      newValue: { active: updated.active }
    });

    return updated;
  },

  async delete(id, actor) {
    const subcategory = await subcategoryRepository.findById(id);
    if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');

    const tickets = await subcategoryRepository.ticketCount(id);
    if (tickets) {
      throw new ConflictError('No se puede eliminar porque la subcategoria tiene tickets asociados. Desactivala para conservar el historial.');
    }

    const deleted = await subcategoryRepository.delete(id);

    await auditService.record({
      userId: actor?.id || null,
      action: 'SUBCATEGORY_DELETED',
      entity: 'Subcategory',
      entityId: id,
      previousValue: subcategory
    });

    return deleted;
  }
};

module.exports = { subcategoryService };
