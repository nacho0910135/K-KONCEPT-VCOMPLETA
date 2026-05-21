const { categoryRepository } = require('../repositories/category.repository');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');

const categoryService = {
  async create(payload) {
    const existing = await categoryRepository.findByName(payload.name);
    if (existing) throw new ConflictError('Ya existe una categoria con ese nombre');

    return categoryRepository.create({
      name: payload.name,
      description: payload.description || null
    });
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

  async update(id, payload) {
    await this.getById(id);
    return categoryRepository.update(id, {
      name: payload.name,
      description: payload.description || null
    });
  },

  async setActive(id, active) {
    await this.getById(id);
    return categoryRepository.update(id, { active });
  }
};

module.exports = { categoryService };
