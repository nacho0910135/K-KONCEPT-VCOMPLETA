const { categoryRepository } = require('../repositories/category.repository');
const { auditService } = require('./audit.service');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');

const categoryService = {
  async create(payload, actor) {
    const existing = await categoryRepository.findByName(payload.name);
    if (existing) throw new ConflictError('Ya existe una categoria con ese nombre');

    const category = await categoryRepository.create({
      name: payload.name,
      description: payload.description || null
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'CATEGORY_CREATED',
      entity: 'Category',
      entityId: category.id,
      newValue: category
    });

    return category;
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {})
    };

    const [total, items] = await categoryRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async getById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Categoria no encontrada');
    return category;
  },

  async update(id, payload, actor) {
    const previous = await this.getById(id);
    const updated = await categoryRepository.update(id, {
      name: payload.name,
      description: payload.description || null
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'CATEGORY_UPDATED',
      entity: 'Category',
      entityId: id,
      previousValue: previous,
      newValue: updated
    });

    return updated;
  },

  async setActive(id, active, actor) {
    const previous = await this.getById(id);
    const updated = await categoryRepository.update(id, { active });

    await auditService.record({
      userId: actor?.id || null,
      action: active ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
      entity: 'Category',
      entityId: id,
      previousValue: { active: previous.active },
      newValue: { active: updated.active }
    });

    return updated;
  }
};

module.exports = { categoryService };
