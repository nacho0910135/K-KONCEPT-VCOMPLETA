const { env } = require('../config/env');
const { ticketCounterRepository } = require('../repositories/ticketCounter.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { replacementRepository } = require('../repositories/replacement.repository');
const { refundService } = require('./refund.service');
const { auditService } = require('./audit.service');
const { deleteFromCloudinary } = require('./cloudinary.service');
const { notificationService } = require('./notification.service');
const { slaService } = require('./sla.service');
const { ticketAssignmentService } = require('./ticketAssignment.service');
const { transactionalEmailService } = require('./transactionalEmail.service');
const { warrantyService } = require('./warranty.service');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { canTransition } = require('../utils/ticketTransitions.util');
const { sanitizePayloadText, sanitizePlainText } = require('../utils/textSanitizer.util');

const CLOSED_STATUSES = ['CLOSED', 'CANCELLED'];
const statusLabel = {
  OPEN: 'Abierto',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  REOPENED: 'Reabierto'
};
const closeTypeLabel = {
  WITH_SOLUTION: 'Con solucion',
  WITHOUT_SOLUTION: 'Sin solucion',
  REPLACEMENT: 'Reemplazo'
};
const resolutionActionLabel = {
  REPAIR: 'Reparacion',
  REFUND_TOTAL: 'Reembolso total',
  REFUND_PARTIAL: 'Reembolso parcial'
};

const resolutionSummary = (payload) => {
  if (payload.closeType === 'REPLACEMENT') return 'Reemplazo';
  if (payload.closeType === 'WITHOUT_SOLUTION') return 'Sin solucion';
  return resolutionActionLabel[payload.resolutionAction] || payload.resolutionAction || 'Con solucion';
};

const resourceTypeForEvidence = (evidence) => {
  if (evidence.fileUrl?.includes('/video/upload/')) return 'video';
  if (evidence.fileUrl?.includes('/raw/upload/')) return 'raw';
  if (evidence.fileUrl?.includes('/image/upload/')) return 'image';
  if (evidence.fileType === 'VIDEO') return 'video';
  if (evidence.fileType === 'PDF' || evidence.fileType === 'DOCUMENT') return 'raw';
  return 'image';
};

const buildSearchWhere = (q) => q ? {
  OR: [
    { code: { contains: q, mode: 'insensitive' } },
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } }
  ]
} : {};

const ensureTicketExists = async (id) => {
  const ticket = await ticketRepository.findById(id);
  if (!ticket) throw new NotFoundError('Ticket no encontrado');
  return ticket;
};

const assertCanViewTicket = async (ticket, user, context = {}) => {
  const allowed = user.role === 'ADMIN'
    || ticket.clientId === user.id
    || ticket.assignedTechnicianId === user.id;

  if (!allowed) {
    await auditService.recordFailure({
      userId: user.id,
      action: 'TICKET_ACCESS_DENIED',
      entity: 'Ticket',
      entityId: ticket.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: { ticketCode: ticket.code }
    });
    throw new ForbiddenError('No tiene acceso a este ticket');
  }
};

const assertTechnicianAssigned = (ticket, user) => {
  if (user.role === 'TECHNICIAN' && ticket.assignedTechnicianId !== user.id) {
    throw new ForbiddenError('Solo el tecnico asignado puede modificar este ticket');
  }
};

const assertAllowedTransition = (ticket, nextStatus, role) => {
  if (!canTransition(ticket.status, nextStatus, role)) {
    throw new BadRequestError(`Transicion no permitida de ${ticket.status} a ${nextStatus}`);
  }
};

const buildStatusNotificationPayload = ({ ticket, payload, user, comment }) => ({
  ticketCode: ticket.code,
  ticketTitle: ticket.title,
  ticketDescription: ticket.description,
  technicianName: user.name,
  previousStatus: statusLabel[ticket.status] || ticket.status,
  newStatus: statusLabel[payload.status] || payload.status,
  closeType: closeTypeLabel[payload.closeType] || payload.closeType || '',
  resolutionAction: resolutionSummary(payload),
  refundAmount: payload.refundAmount || '',
  productName: ticket.product?.name || 'Sin producto asociado',
  categoryName: ticket.category?.name || 'Sin categoria',
  subcategoryName: ticket.subcategory?.name || 'Sin subcategoria',
  diagnosis: payload.diagnosis || ticket.diagnosis || '',
  solution: payload.solution || ticket.solution || payload.closeJustification || '',
  comment: comment || ''
});

const ticketService = {
  async preview(payload, user) {
    const sanitizedPayload = sanitizePayloadText(payload, ['title', 'description']);
    return {
      requester: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      ticket: {
        title: sanitizedPayload.title,
        description: sanitizedPayload.description,
        priority: sanitizedPayload.priority || 'MEDIUM',
        categoryId: sanitizedPayload.categoryId,
        subcategoryId: sanitizedPayload.subcategoryId || null,
        productId: sanitizedPayload.productId || null
      }
    };
  },

  getAssignmentSettings() {
    return ticketAssignmentService.getSettings();
  },

  updateAssignmentSettings(payload, user) {
    return ticketAssignmentService.updateSettings(payload, user);
  },

  async create(payload, user) {
    const sanitizedPayload = sanitizePayloadText(payload, ['title', 'description']);
    let warrantyId = payload.warrantyId || null;
    let warrantyStatusAtCreation = null;
    let warrantyWarning = null;

    if (payload.productId) {
      const warrantyValidation = await warrantyService.validateProductForTicket({
        productId: payload.productId,
        clientId: user.id
      });

      warrantyStatusAtCreation = warrantyValidation.status;

      if (warrantyValidation.isValid) {
        warrantyId = warrantyValidation.warrantyId;
      } else {
        warrantyWarning = warrantyValidation.status === 'EXPIRED'
          ? 'El producto tiene garantia expirada al momento de crear el ticket'
          : 'No existe una garantia aplicable para este producto y cliente';

        if (env.tickets.blockWithoutWarranty) {
          throw new BadRequestError(warrantyWarning);
        }
      }
    }

    const priority = sanitizedPayload.priority || 'MEDIUM';
    const sla = await slaService.calculateDeadlineForTicket({ priority, categoryId: sanitizedPayload.categoryId, clientId: user.id });

    let ticket = await ticketCounterRepository.createTicketWithSequentialCode({
      title: sanitizedPayload.title,
      description: sanitizedPayload.description,
      priority,
      categoryId: sanitizedPayload.categoryId,
      subcategoryId: sanitizedPayload.subcategoryId || null,
      clientId: user.id,
      productId: payload.productId || null,
      warrantyId,
      warrantyStatusAtCreation,
      warrantyWarning,
      slaId: sla.slaId,
      slaDeadline: sla.slaDeadline,
      slaSource: sla.slaSource
    });

    const systemUser = await userRepository.findSystemUser();
    const assignmentResult = await ticketAssignmentService.assignIfEnabled(ticket, systemUser || user);
    ticket = assignmentResult.ticket;

    await auditService.record({
      userId: user.id,
      action: 'TICKET_CREATED',
      entity: 'Ticket',
      entityId: ticket.id,
      newValue: { code: ticket.code }
    });

    await notificationService.notifyUsers({
      event: 'TICKET_CREATED',
      recipients: [ticket.client],
      entityType: 'Ticket',
      entityId: ticket.id,
      payload: {
        userName: user.name,
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        ticketDescription: ticket.description,
        categoryName: ticket.category?.name || 'Sin categoria',
        subcategoryName: ticket.subcategory?.name || 'Sin subcategoria',
        priority: ticket.priority,
        status: ticket.status,
        technicianName: ticket.assignedTechnician?.name || '',
        ticketUrl: `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`
      }
    });

    return ticket;
  },

  async listMine(query, user) {
    const pagination = buildPagination(query);
    const where = {
      clientId: user.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
      ...buildSearchWhere(query.q)
    };

    const [total, items] = await ticketRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async listAssigned(query, user) {
    const pagination = buildPagination(query);
    const where = {
      assignedTechnicianId: user.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {})
    };

    const [total, items] = await ticketRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async listAll(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.technicianId ? { assignedTechnicianId: query.technicianId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
      ...buildSearchWhere(query.q)
    };

    const [total, items] = await ticketRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async getById(id, user, context) {
    const ticket = await ensureTicketExists(id);
    await assertCanViewTicket(ticket, user, context);
    return ticket;
  },

  async changeStatus(id, payload, user) {
    const ticket = await ensureTicketExists(id);
    assertTechnicianAssigned(ticket, user);

    assertAllowedTransition(ticket, payload.status, user.role);

    const data = { status: payload.status };
    let comment = sanitizePlainText(payload.comment);

    if (payload.status === 'RESOLVED') {
      data.closeType = payload.closeType;

      if (payload.closeType === 'WITH_SOLUTION') {
        data.diagnosis = sanitizePlainText(payload.diagnosis);
        data.solution = sanitizePlainText(payload.solution);
      }

      if (payload.closeType === 'REPLACEMENT') {
        data.diagnosis = sanitizePlainText(payload.diagnosis);
        data.solution = sanitizePlainText(payload.solution);
      }

      if (payload.closeType === 'WITHOUT_SOLUTION') {
        data.closeJustification = sanitizePlainText(payload.closeJustification);
      }

      comment = comment || `Ticket resuelto por tecnico: ${resolutionSummary(payload)}`;
    }

    const updated = await ticketRepository.updateStatusWithHistory(id, data, {
      previousStatus: ticket.status,
      newStatus: payload.status,
      changedById: user.id,
      comment
    });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_STATUS_CHANGED',
      entity: 'Ticket',
      entityId: id,
      previousValue: { status: ticket.status },
      newValue: { status: payload.status }
    });

    if (payload.returnItemRequested && payload.status === 'WAITING_CUSTOMER') {
      await transactionalEmailService.sendReturnItemRequestEmail(ticket.client, ticket, user).catch(() => null);
    }

    if (payload.status === 'RESOLVED' && payload.closeType === 'REPLACEMENT') {
      const activeReplacement = await replacementRepository.findActiveByTicketId(id);
      if (!activeReplacement) {
        await replacementRepository.create({
          ticketId: id,
          requestedById: user.id,
          requestedProduct: payload.requestedProduct || ticket.product?.name || ticket.title,
          reason: payload.solution || payload.comment || 'Reemplazo indicado en resolucion',
          status: 'APPROVED',
          approvedById: user.id,
          validationNotes: 'Aprobado por tecnico en resolucion del caso',
          validatedAt: new Date()
        });
      }
    }

    if (payload.status === 'RESOLVED' && ['REFUND_TOTAL', 'REFUND_PARTIAL'].includes(payload.resolutionAction)) {
      await refundService.createForTicket(id, {
        type: payload.resolutionAction,
        amount: payload.resolutionAction === 'REFUND_PARTIAL' ? payload.refundAmount : null,
        reason: payload.solution || payload.comment || 'Reembolso indicado en resolucion'
      }, user);
    }

    const notificationPayload = buildStatusNotificationPayload({ ticket, payload, user, comment });

    await transactionalEmailService.sendTicketStatusEmail(ticket.client, ticket, notificationPayload).catch(() => null);

    await notificationService.dispatchNotification({
      userId: ticket.clientId,
      event: payload.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'STATUS_CHANGED',
      entityType: 'Ticket',
      entityId: id,
      payload: notificationPayload,
      skipChannels: ['EMAIL']
    });

    if (user.role === 'TECHNICIAN') {
      const admins = await userRepository.findActiveAdmins();
      await notificationService.notifyUsers({
        event: payload.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'STATUS_CHANGED',
        recipients: admins,
        entityType: 'Ticket',
        entityId: id,
        payload: notificationPayload
      });
    }

    return updated;
  },

  async delete(id, user) {
    const ticket = await ensureTicketExists(id);
    const evidenceToDelete = ticket.evidence || [];
    const deleted = await ticketRepository.deleteById(id);

    await Promise.allSettled(evidenceToDelete
      .filter((evidence) => evidence.publicId)
      .map((evidence) => deleteFromCloudinary(evidence.publicId, resourceTypeForEvidence(evidence))));

    await auditService.record({
      userId: user.id,
      action: 'TICKET_DELETED',
      entity: 'Ticket',
      entityId: id,
      previousValue: {
        code: ticket.code,
        title: ticket.title,
        status: ticket.status,
        clientId: ticket.clientId,
        assignedTechnicianId: ticket.assignedTechnicianId
      }
    });

    return deleted;
  },

  async confirmSolution(id, payload, user) {
    const ticket = await ensureTicketExists(id);

    if (ticket.clientId !== user.id) throw new ForbiddenError('Solo el cliente solicitante puede cerrar este ticket');
    if (ticket.status !== 'RESOLVED') throw new BadRequestError('Solo se pueden confirmar tickets en estado RESOLVED');
    assertAllowedTransition(ticket, 'CLOSED', user.role);

    const comment = `Cierre confirmado por cliente con calificación ${payload.rating}/5`;
    const updated = await ticketRepository.updateStatusWithHistory(id, {
      status: 'CLOSED',
      rating: payload.rating,
      ratingComment: sanitizePlainText(payload.ratingComment) || null
    }, {
      previousStatus: ticket.status,
      newStatus: 'CLOSED',
      changedById: user.id,
      comment
    });

    await notificationService.notifyUsers({
      event: 'TICKET_CLOSED',
      recipients: [ticket.client],
      entityType: 'Ticket',
      entityId: ticket.id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title
      }
    });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_CLOSED',
      entity: 'Ticket',
      entityId: id,
      previousValue: { status: ticket.status },
      newValue: { status: 'CLOSED', rating: payload.rating }
    });

    return updated;
  },

  async rejectSolution(id, payload, user) {
    const ticket = await ensureTicketExists(id);

    if (ticket.clientId !== user.id) throw new ForbiddenError('Solo el cliente solicitante puede rechazar la solucion');
    if (ticket.status !== 'RESOLVED') throw new BadRequestError('Solo se pueden rechazar tickets en estado RESOLVED');
    assertAllowedTransition(ticket, 'REOPENED', user.role);

    const updated = await ticketRepository.updateStatusWithHistory(id, {
      status: 'REOPENED'
    }, {
      previousStatus: ticket.status,
      newStatus: 'REOPENED',
      changedById: user.id,
      comment: sanitizePlainText(payload.reason)
    });

    await notificationService.notifyUsers({
      event: 'STATUS_CHANGED',
      title: 'Solucion rechazada',
      message: `El cliente rechazo la solucion del ticket ${ticket.code}.`,
      recipients: [ticket.assignedTechnician],
      entityType: 'Ticket',
      entityId: ticket.id
    });

    return updated;
  },

  async updateDiagnosis(id, payload, user) {
    const ticket = await ensureTicketExists(id);
    assertTechnicianAssigned(ticket, user);

    const updated = await ticketRepository.update(id, { diagnosis: sanitizePlainText(payload.diagnosis) });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_UPDATED',
      entity: 'Ticket',
      entityId: id,
      previousValue: { diagnosis: ticket.diagnosis },
      newValue: { diagnosis: updated.diagnosis }
    });

    return updated;
  },

  async assignTechnician(id, payload, user) {
    const ticket = await ensureTicketExists(id);
    const technician = await userRepository.findActiveTechnicianById(payload.technicianId);
    if (!technician) throw new BadRequestError('El usuario destino no es un tecnico activo');

    const sla = await slaService.calculateDeadlineForTicket({
      priority: ticket.priority,
      categoryId: ticket.categoryId,
      clientId: ticket.clientId,
      createdAt: ticket.createdAt
    });
    const shouldMoveToPending = ticket.status === 'OPEN';
    if (shouldMoveToPending) {
      assertAllowedTransition(ticket, 'PENDING', user.role);
    }
    const updated = await ticketRepository.assignTechnician(id, technician.id, shouldMoveToPending ? {
      previousStatus: ticket.status,
      newStatus: 'PENDING',
      changedById: user.id,
      comment: `Ticket asignado a ${technician.name}`
    } : null, shouldMoveToPending ? 'PENDING' : undefined, {
      slaId: sla.slaId,
      slaDeadline: sla.slaDeadline,
      slaSource: sla.slaSource,
      slaBreached: false
    });

    await notificationService.notifyUsers({
      event: 'TICKET_ASSIGNED',
      recipients: [technician, ticket.client],
      entityType: 'Ticket',
      entityId: ticket.id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        clientName: ticket.client?.name || '',
        technicianName: technician.name
      }
    });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_ASSIGNED',
      entity: 'Ticket',
      entityId: id,
      previousValue: { assignedTechnicianId: ticket.assignedTechnicianId },
      newValue: { assignedTechnicianId: technician.id }
    });

    return updated;
  },

  async updatePriority(id, payload, user) {
    const ticket = await ensureTicketExists(id);
    const sla = await slaService.calculateDeadlineForTicket({
      priority: payload.priority,
      categoryId: ticket.categoryId,
      clientId: ticket.clientId,
      createdAt: ticket.createdAt
    });

    const updated = await ticketRepository.update(id, {
      priority: payload.priority,
      slaId: sla.slaId,
      slaDeadline: sla.slaDeadline,
      slaSource: sla.slaSource,
      slaBreached: false
    });

    await auditService.record({
      userId: user.id,
      action: 'TICKET_PRIORITY_CHANGED',
      entity: 'Ticket',
      entityId: id,
      previousValue: { priority: ticket.priority },
      newValue: { priority: payload.priority }
    });

    return updated;
  },

  async getHistory(id, user, context) {
    const ticket = await this.getById(id, user, context);
    const [statuses, comments, evidence] = await ticketRepository.getChronologicalHistory(ticket.id);

    return { statuses, comments, evidence };
  },

  async search(query, user) {
    const pagination = buildPagination(query);
    const where = {
      OR: [
        { code: { contains: query.q, mode: 'insensitive' } },
        { client: { name: { contains: query.q, mode: 'insensitive' } } }
      ],
      ...(user.role === 'TECHNICIAN' ? { assignedTechnicianId: user.id } : {})
    };

    const [total, items] = await ticketRepository.search({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    if (total === 0) throw new NotFoundError('No se encontraron tickets para la busqueda indicada');

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  ensureCanComment(ticket, user) {
    if (CLOSED_STATUSES.includes(ticket.status)) {
      throw new BadRequestError('No se puede comentar un ticket cerrado o cancelado');
    }

    if (user.role === 'CLIENT' && ticket.clientId !== user.id) throw new ForbiddenError('No puede comentar este ticket');
    if (user.role === 'TECHNICIAN' && ticket.assignedTechnicianId !== user.id) throw new ForbiddenError('No puede comentar este ticket');
  }
};

module.exports = { ticketService };
