const { productRepository } = require('../repositories/product.repository');
const { userRepository } = require('../repositories/user.repository');
const { warrantyRepository } = require('../repositories/warranty.repository');
const { auditService } = require('./audit.service');
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
  async create(payload, actor) {
    const product = await productRepository.findById(payload.productId);
    if (!product) throw new NotFoundError('Producto no encontrado');

    const client = await userRepository.findActiveClientById(payload.clientId);
    if (!client) throw new BadRequestError('El cliente indicado no existe o no esta activo');

    const calculated = calculateWarrantyStatus(payload.startDate, payload.endDate);

    const warranty = await warrantyRepository.create({
      productId: payload.productId,
      clientId: payload.clientId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      notes: payload.notes || null,
      status: calculated.status
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'WARRANTY_CREATED',
      entity: 'Warranty',
      entityId: warranty.id,
      newValue: warranty
    });

    return warranty;
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

  async update(id, payload, actor) {
    const warranty = await warrantyRepository.findById(id);
    if (!warranty) throw new NotFoundError('Garantia no encontrada');

    const startDate = payload.startDate || warranty.startDate;
    const endDate = payload.endDate || warranty.endDate;

    if (endDate < startDate) {
      throw new BadRequestError('La fecha final debe ser mayor o igual a la fecha inicial');
    }

    const calculated = calculateWarrantyStatus(startDate, endDate);

    const updated = await warrantyRepository.update(id, {
      startDate,
      endDate,
      notes: payload.notes !== undefined ? payload.notes : warranty.notes,
      status: calculated.status
    });

    await auditService.record({
      userId: actor?.id || null,
      action: 'WARRANTY_UPDATED',
      entity: 'Warranty',
      entityId: id,
      previousValue: warranty,
      newValue: updated
    });

    return updated;
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

    const result = buildWarrantyValidationResponse(warranty, product);

    await auditService.record({
      userId: user.id,
      action: 'WARRANTY_VALIDATED',
      entity: 'Warranty',
      entityId: warranty?.id || null,
      details: {
        productId: product.id,
        productSerial,
        isValid: result.isValid,
        status: result.status
      }
    });

    return result;
  },

  async validateProductForTicket({ productId, clientId }) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto no encontrado');

    const warranty = await warrantyRepository.findByProductAndClient({ productId, clientId });
    return buildWarrantyValidationResponse(warranty, product);
  }
};

module.exports = { warrantyService };
