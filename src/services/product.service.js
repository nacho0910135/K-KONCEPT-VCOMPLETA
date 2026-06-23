const { categoryRepository } = require('../repositories/category.repository');
const { productRepository } = require('../repositories/product.repository');
const { subcategoryRepository } = require('../repositories/subcategory.repository');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');

const normalizeProductPayload = (payload) => ({
  name: payload.name,
  brand: payload.brand || null,
  model: payload.model || null,
  serialNumber: payload.serialNumber || null,
  categoryId: payload.categoryId || null,
  subcategoryId: payload.subcategoryId || null,
  description: payload.description || null,
  purchaseDate: payload.purchaseDate || null
});

const normalizeProductNames = (products = []) => [...new Set(products
  .map((product) => String(product || '').trim())
  .filter(Boolean))];

const productService = {
  async create(payload) {
    if (payload.serialNumber) {
      const existing = await productRepository.findBySerialNumber(payload.serialNumber);
      if (existing) throw new ConflictError('Ya existe un producto con ese numero de serie');
    }

    if (payload.categoryId) {
      const category = await categoryRepository.findById(payload.categoryId);
      if (!category) throw new NotFoundError('Categoria no encontrada');
    }

    if (payload.subcategoryId) {
      const subcategory = await subcategoryRepository.findById(payload.subcategoryId);
      if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');
      if (payload.categoryId && subcategory.categoryId !== payload.categoryId) throw new ConflictError('La subcategoria no pertenece a la categoria');
    }

    return productRepository.create(normalizeProductPayload(payload));
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.subcategoryId ? { subcategoryId: query.subcategoryId } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { serialNumber: { contains: query.q, mode: 'insensitive' } },
          { brand: { contains: query.q, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [total, items] = await productRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('Producto no encontrado');
    return product;
  },

  async update(id, payload) {
    const product = await this.getById(id);

    if (payload.serialNumber && payload.serialNumber !== product.serialNumber) {
      const existing = await productRepository.findBySerialNumber(payload.serialNumber);
      if (existing) throw new ConflictError('Ya existe un producto con ese numero de serie');
    }

    if (payload.categoryId) {
      const category = await categoryRepository.findById(payload.categoryId);
      if (!category) throw new NotFoundError('Categoria no encontrada');
    }

    if (payload.subcategoryId) {
      const subcategory = await subcategoryRepository.findById(payload.subcategoryId);
      if (!subcategory) throw new NotFoundError('Subcategoria no encontrada');
      if (payload.categoryId && subcategory.categoryId !== payload.categoryId) throw new ConflictError('La subcategoria no pertenece a la categoria');
    }

    return productRepository.update(id, normalizeProductPayload(payload));
  },

  async addNamesToSubcategory({ categoryId, subcategoryId, products = [] }) {
    const names = normalizeProductNames(products);
    const created = [];

    for (const name of names) {
      const existing = await productRepository.findByNameAndSubcategory(name, subcategoryId);
      if (existing) continue;
      created.push(await productRepository.create({
        name,
        categoryId,
        subcategoryId,
        serialNumber: null
      }));
    }

    return created;
  },

  async deactivate(id) {
    await this.getById(id);
    return productRepository.update(id, { active: false });
  }
};

module.exports = { productService };
