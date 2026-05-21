const { replacementRepository } = require('../repositories/replacement.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const { pdfGenerationService } = require('./pdfGeneration.service');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

const assertTicketAccess = (ticket, user) => {
  const allowed = user.role === 'ADMIN'
    || ticket.clientId === user.id
    || ticket.assignedTechnicianId === user.id;

  if (!allowed) throw new ForbiddenError('No tiene acceso a este reemplazo');
};

const assertAssignedTechnicianOrAdmin = (ticket, user) => {
  if (user.role === 'ADMIN') return;
  if (user.role === 'TECHNICIAN' && ticket.assignedTechnicianId === user.id) return;
  throw new ForbiddenError('Solo el tecnico asignado o un administrador puede ejecutar esta accion');
};

const ensureReplacement = async (id) => {
  const replacement = await replacementRepository.findById(id);
  if (!replacement) throw new NotFoundError('Reemplazo no encontrado');
  return replacement;
};

const hasNewProductData = (replacement) => Boolean(
  replacement.replacementProductId
  || (
    replacement.replacementSerialNumber
    && replacement.replacementBrand
    && replacement.replacementModel
  )
);

const replacementService = {
  async request(ticketId, payload, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    assertAssignedTechnicianOrAdmin(ticket, user);

    const activeReplacement = await replacementRepository.findActiveByTicketId(ticketId);
    if (activeReplacement) {
      throw new ConflictError('El ticket ya tiene un reemplazo activo');
    }

    const replacement = await replacementRepository.create({
      ticketId,
      requestedById: user.id,
      requestedProduct: payload.requestedProduct,
      reason: payload.reason,
      status: 'PENDING_APPROVAL'
    });

    const admins = await userRepository.findActiveAdmins();
    await notificationService.notifyUsers({
      event: 'REPLACEMENT_APPROVED',
      recipients: admins,
      entityType: 'Replacement',
      entityId: replacement.id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        replacementStatus: replacement.status
      }
    });

    await auditService.record({
      userId: user.id,
      action: 'REPLACEMENT_REQUESTED',
      entity: 'Replacement',
      entityId: replacement.id,
      newValue: { status: replacement.status, ticketId }
    });

    return replacement;
  },

  async validate(id, payload, user) {
    const replacement = await ensureReplacement(id);
    assertAssignedTechnicianOrAdmin(replacement.ticket, user);

    if (replacement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError('Solo se pueden validar reemplazos pendientes de aprobacion');
    }

    const nextStatus = payload.approved ? 'APPROVED' : 'REJECTED';
    const updated = await replacementRepository.update(id, {
      status: nextStatus,
      approvedById: payload.approved ? user.id : null,
      validationNotes: payload.validationNotes || null,
      validatedAt: new Date()
    });

    await auditService.record({
      userId: user.id,
      action: 'REPLACEMENT_VALIDATED',
      entity: 'Replacement',
      entityId: id,
      previousValue: { status: replacement.status },
      newValue: { status: nextStatus, validationNotes: payload.validationNotes || null }
    });

    await notificationService.notifyUsers({
      event: payload.approved ? 'REPLACEMENT_APPROVED' : 'STATUS_CHANGED',
      recipients: [replacement.ticket.client],
      entityType: 'Replacement',
      entityId: id,
      payload: {
        ticketCode: replacement.ticket.code,
        ticketTitle: replacement.ticket.title,
        newStatus: nextStatus,
        replacementStatus: nextStatus
      }
    });

    return updated;
  },

  async saveNewProduct(id, payload, user) {
    const replacement = await ensureReplacement(id);
    assertAssignedTechnicianOrAdmin(replacement.ticket, user);

    if (replacement.status !== 'APPROVED') {
      throw new BadRequestError('Solo se puede registrar producto nuevo en reemplazos aprobados');
    }

    if (replacement.deliveryDate) {
      throw new BadRequestError('No se puede editar el producto nuevo despues de registrar la entrega');
    }

    if (payload.replacementProductId) {
      const product = await replacementRepository.findProductById(payload.replacementProductId);
      if (!product) throw new NotFoundError('Producto de reemplazo no encontrado');
    } else {
      const existingSerial = await replacementRepository.findProductBySerial(payload.replacementSerialNumber);
      if (existingSerial) throw new ConflictError('Ya existe un producto con ese numero de serie');
    }

    const updated = await replacementRepository.update(id, {
      replacementProductId: payload.replacementProductId || null,
      replacementSerialNumber: payload.replacementSerialNumber,
      replacementBrand: payload.replacementBrand,
      replacementModel: payload.replacementModel,
      replacementNotes: payload.replacementNotes || null
    });

    await auditService.record({
      userId: user.id,
      action: 'REPLACEMENT_NEW_PRODUCT_SAVED',
      entity: 'Replacement',
      entityId: id,
      previousValue: {
        replacementProductId: replacement.replacementProductId,
        replacementSerialNumber: replacement.replacementSerialNumber,
        replacementBrand: replacement.replacementBrand,
        replacementModel: replacement.replacementModel
      },
      newValue: {
        replacementProductId: updated.replacementProductId,
        replacementSerialNumber: updated.replacementSerialNumber,
        replacementBrand: updated.replacementBrand,
        replacementModel: updated.replacementModel
      }
    });

    return updated;
  },

  async registerDelivery(id, payload, user) {
    const replacement = await ensureReplacement(id);
    assertAssignedTechnicianOrAdmin(replacement.ticket, user);

    if (replacement.status !== 'APPROVED') {
      throw new BadRequestError('Solo se puede registrar entrega de reemplazos aprobados');
    }

    if (replacement.deliveryDate || replacement.status === 'DELIVERED') {
      throw new BadRequestError('La entrega ya fue registrada');
    }

    if (!hasNewProductData(replacement)) {
      throw new BadRequestError('Debe registrar los datos del producto nuevo antes de la entrega');
    }

    const delivered = await replacementRepository.update(id, {
      status: 'DELIVERED',
      deliveredById: user.id,
      deliveryDate: payload.deliveryDate,
      deliveryObservations: payload.deliveryObservations
    });

    await auditService.record({
      userId: user.id,
      action: 'REPLACEMENT_DELIVERED',
      entity: 'Replacement',
      entityId: id,
      previousValue: { status: replacement.status },
      newValue: {
        status: 'DELIVERED',
        deliveryDate: payload.deliveryDate
      }
    });

    const certificate = await pdfGenerationService.generateAndUploadReplacementCertificate(delivered);
    const updated = await replacementRepository.update(id, certificate);

    await notificationService.notifyUsers({
      event: 'REPLACEMENT_APPROVED',
      recipients: [replacement.ticket.client],
      entityType: 'Replacement',
      entityId: id,
      payload: {
        ticketCode: replacement.ticket.code,
        ticketTitle: replacement.ticket.title,
        replacementStatus: 'DELIVERED'
      }
    });

    await auditService.record({
      userId: user.id,
      action: 'CERTIFICATE_GENERATED',
      entity: 'Replacement',
      entityId: id,
      newValue: { pdfUrl: updated.pdfUrl, pdfPublicId: updated.pdfPublicId }
    });

    return updated;
  },

  async getById(id, user) {
    const replacement = await ensureReplacement(id);
    assertTicketAccess(replacement.ticket, user);
    return replacement;
  },

  async getByTicketId(ticketId, user) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    assertTicketAccess(ticket, user);

    const replacement = await replacementRepository.findByTicketId(ticketId);
    if (!replacement) throw new NotFoundError('Reemplazo no encontrado para este ticket');
    return replacement;
  },

  async getCertificate(id, user) {
    const replacement = await this.getById(id, user);
    if (!replacement.pdfUrl) throw new NotFoundError('Constancia PDF no generada');
    return replacement;
  },

  async regenerateCertificate(id, user) {
    const replacement = await ensureReplacement(id);

    if (replacement.status !== 'DELIVERED') {
      throw new BadRequestError('Solo se puede regenerar constancia de reemplazos entregados');
    }

    const certificate = await pdfGenerationService.generateAndUploadReplacementCertificate(replacement);
    const updated = await replacementRepository.update(id, certificate);

    await auditService.record({
      userId: user.id,
      action: 'CERTIFICATE_GENERATED',
      entity: 'Replacement',
      entityId: id,
      newValue: { pdfUrl: updated.pdfUrl, regenerated: true }
    });

    return updated;
  }
};

module.exports = { replacementService };
