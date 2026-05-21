const { productRepository } = require('../repositories/product.repository');
const { userRepository } = require('../repositories/user.repository');
const { warrantyRepository } = require('../repositories/warranty.repository');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { calculateWarrantyStatus, buildWarrantyValidationResponse } = require('../utils/warranty.util');

const enrichWarranty = (warranty) => {
  const calculated = calculateWarrantyStatus(warranty.startDate, warranty.endDate);

  return {
    ...warranty,
    calculatedStatus: calculated.status,
    isValid: calculated.isValid,
    daysRemaining: calculated.daysRemaining
  };
};

const warrantyService = {
  async create(payload) {
    const product = await productRepository.findById(payload.productId);
    if (!product) throw new NotFoundError('Producto no encontrado');

    const client = await userRepository.findActiveClientById(payload.clientId);
    if (!client) throw new BadRequestError('El cliente indicado no existe o no esta activo');

    const calculated = calculateWarrantyStatus(payload.startDate, payload.endDate);

    return warrantyRepository.create({
      productId: payload.productId,
      clientId: payload.clientId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      notes: payload.notes || null,
      status: calculated.status
    });
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [total, warranties] = await warrantyRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return {
      items: warranties.map(enrichWarranty),
      pagination: buildPaginationMeta({ ...pagination, total })
    };
  },

  async listMine(user) {
    const warranties = await warrantyRepository.listByClient(user.id);
    return warranties.map(enrichWarranty);
  },

  async update(id, payload) {
    const warranty = await warrantyRepository.findById(id);
    if (!warranty) throw new NotFoundError('Garantia no encontrada');

    const startDate = payload.startDate || warranty.startDate;
    const endDate = payload.endDate || warranty.endDate;

    if (endDate < startDate) {
      throw new BadRequestError('La fecha final debe ser mayor o igual a la fecha inicial');
    }

    const calculated = calculateWarrantyStatus(startDate, endDate);

    return warrantyRepository.update(id, {
      startDate,
      endDate,
      notes: payload.notes !== undefined ? payload.notes : warranty.notes,
      status: calculated.status
    });
  },

  async delete(id) {
    const warranty = await warrantyRepository.findById(id);
    if (!warranty) throw new NotFoundError('Garantia no encontrada');

    return warrantyRepository.delete(id);
  },

  async validateForClient({ productSerial, productId }, user) {
    const product = productId
      ? await productRepository.findById(productId)
      : await productRepository.findBySerialNumber(productSerial);

    if (!product) {
      throw new NotFoundError('Producto no encontrado para los datos enviados');
    }

    const warranty = await warrantyRepository.findByProductAndClient({
      productId: product.id,
      clientId: user.id
    });

    return buildWarrantyValidationResponse(warranty, product);
  },

  async validateProductForTicket({ productId, clientId }) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto no encontrado');

    const warranty = await warrantyRepository.findByProductAndClient({ productId, clientId });
    return buildWarrantyValidationResponse(warranty, product);
  }
};

module.exports = { warrantyService };
