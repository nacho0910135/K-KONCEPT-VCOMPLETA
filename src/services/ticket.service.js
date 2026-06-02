const { env } = require('../config/env');
const { ticketCounterRepository } = require('../repositories/ticketCounter.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { deleteFromCloudinary } = require('./cloudinary.service');
const { notificationService } = require('./notification.service');
const { slaService } = require('./sla.service');
const { transactionalEmailService } = require('./transactionalEmail.service');
const { warrantyService } = require('./warranty.service');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { canTransition } = require('../utils/ticketTransitions.util');
const { sanitizePayloadText, sanitizePlainText } = require('../utils/textSanitizer.util');

const CLOSED_STATUSES = ['CLOSED', 'CANCELLED'];

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
    throw new ForbiddenError(`Transicion no permitida de ${ticket.status} a ${nextStatus} para rol ${role}`);
  }
};

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

    const ticket = await ticketCounterRepository.createTicketWithSequentialCode({
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
        ticketUrl: `${env.appUrl.replace(/\/$/, '')}/client/tickets/${ticket.id}`
      }
    });

    transactionalEmailService.sendTicketCreatedEmail(ticket.client, ticket).catch((error) => {
      logger.error({ error, userId: ticket.clientId, ticketId: ticket.id }, 'No se pudo enviar correo de confirmacion de ticket');
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

      if (payload.closeType === 'WITHOUT_SOLUTION') {
        data.closeJustification = sanitizePlainText(payload.closeJustification);
      }

      if (payload.closeType === 'REPLACEMENT') {
        const deliveredReplacement = await ticketRepository.findDeliveredReplacement(ticket.id);
        if (!deliveredReplacement) {
          throw new BadRequestError('Para cierre por reemplazo debe existir un reemplazo entregado');
        }
      }

      comment = comment || `Ticket resuelto por tecnico con cierre ${payload.closeType}`;
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

    await notificationService.dispatchNotification({
      userId: ticket.clientId,
      event: payload.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'STATUS_CHANGED',
      entityType: 'Ticket',
      entityId: id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
        previousStatus: ticket.status,
        newStatus: payload.status
      }
    });

    if (user.role === 'TECHNICIAN') {
      const admins = await userRepository.findActiveAdmins();
      await notificationService.notifyUsers({
        event: payload.status === 'RESOLVED' ? 'TICKET_RESOLVED' : 'STATUS_CHANGED',
        recipients: admins,
        entityType: 'Ticket',
        entityId: id,
        payload: {
          ticketCode: ticket.code,
          ticketTitle: ticket.title,
          technicianName: user.name,
          previousStatus: ticket.status,
          newStatus: payload.status
        }
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
      recipients: [technician],
      entityType: 'Ticket',
      entityId: ticket.id,
      payload: {
        ticketCode: ticket.code,
        ticketTitle: ticket.title,
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
