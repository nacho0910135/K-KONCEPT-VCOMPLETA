const { categoryRepository } = require('../repositories/category.repository');
const { auditLogRepository } = require('../repositories/auditLog.repository');
const { slaRepository } = require('../repositories/sla.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { resolveApplicableSLA } = require('../utils/slaResolver.util');

const SLA_BREACH_ACTION = 'SLA_BREACH';

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const buildSlaSnapshot = (sla) => ({
  id: sla.id,
  name: sla.name,
  version: sla.version,
  priority: sla.priority,
  categoryId: sla.categoryId,
  clientId: sla.clientId,
  maxResponseHours: sla.maxResponseHours,
  maxResolutionHours: sla.maxResolutionHours,
  active: sla.active
});

const ensureSlaExists = async (id) => {
  const sla = await slaRepository.findById(id);
  if (!sla) throw new NotFoundError('SLA no encontrado');
  return sla;
};

const assertReferencedEntitiesExist = async ({ categoryId, clientId }) => {
  if (categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category || category.active === false) {
      throw new BadRequestError('La categoria indicada no existe o no esta activa');
    }
  }

  if (clientId) {
    const client = await userRepository.findActiveClientById(clientId);
    if (!client) {
      throw new BadRequestError('El cliente indicado no existe o no esta activo');
    }
  }
};

const calculateTicketSlaFields = async ({ priority, categoryId, clientId, createdAt = new Date() }) => {
  const applicable = await resolveApplicableSLA({ priority, categoryId, clientId });

  if (!applicable) {
    return {
      slaId: null,
      slaDeadline: null,
      slaSource: null
    };
  }

  return {
    slaId: applicable.sla.id,
    slaDeadline: addHours(createdAt, applicable.sla.maxResolutionHours),
    slaSource: applicable.source
  };
};

const slaAppliesToTicket = async (sla, ticket) => {
  const applicable = await resolveApplicableSLA({
    priority: ticket.priority,
    categoryId: ticket.categoryId,
    clientId: ticket.clientId
  });

  return applicable?.sla.id === sla.id;
};

const slaService = {
  calculateDeadlineForTicket: calculateTicketSlaFields,

  async create(payload, user, context = {}) {
    await assertReferencedEntitiesExist(payload);

    const sla = await slaRepository.create({
      name: payload.name,
      priority: payload.priority || null,
      categoryId: payload.categoryId || null,
      clientId: payload.clientId || null,
      maxResponseHours: payload.maxResponseHours,
      maxResolutionHours: payload.maxResolutionHours,
      version: 1,
      active: true
    });

    await auditService.record({
      userId: user.id,
      action: 'SLA_CREATED',
      entity: 'Sla',
      entityId: sla.id,
      newValue: buildSlaSnapshot(sla),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return sla;
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.active !== undefined
        ? { active: query.active }
        : query.includeVersions
          ? {}
          : { active: true })
    };

    const [total, items] = await slaRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async history(id) {
    const sla = await ensureSlaExists(id);
    return slaRepository.findHistory(sla);
  },

  async update(id, payload, user, context = {}) {
    const current = await ensureSlaExists(id);

    if (!current.active) {
      throw new BadRequestError('Solo se puede versionar un SLA activo');
    }

    const updated = await slaRepository.versionSla(current, payload);
    let recalculated = 0;

    if (payload.scope === 'RECALCULATE_OPEN') {
      recalculated = await this.recalculateOpenTicketsForSla(updated);
    }

    await auditService.record({
      userId: user.id,
      action: 'SLA_UPDATED',
      entity: 'Sla',
      entityId: updated.id,
      previousValue: buildSlaSnapshot(current),
      newValue: {
        ...buildSlaSnapshot(updated),
        scope: payload.scope,
        recalculatedTickets: recalculated
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return {
      ...updated,
      previousVersionId: current.id,
      recalculatedTickets: recalculated
    };
  },

  async remove(id, user, context = {}) {
    const current = await ensureSlaExists(id);
    const removed = await slaRepository.deactivate(id);

    await auditService.record({
      userId: user.id,
      action: 'SLA_DELETED',
      entity: 'Sla',
      entityId: id,
      previousValue: buildSlaSnapshot(current),
      newValue: buildSlaSnapshot(removed),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return removed;
  },

  async recalculateOpenTicketsForSla(sla) {
    const tickets = await ticketRepository.findOpenTicketsForSlaRecalculation();
    let recalculated = 0;

    for (const ticket of tickets) {
      if (await slaAppliesToTicket(sla, ticket)) {
        await ticketRepository.update(ticket.id, {
          slaId: sla.id,
          slaDeadline: addHours(ticket.createdAt, sla.maxResolutionHours),
          slaSource: ticket.clientId === sla.clientId
            ? 'CLIENT'
            : ticket.categoryId === sla.categoryId
              ? 'CATEGORY'
              : 'PRIORITY',
          slaBreached: false
        });
        recalculated += 1;
      }
    }

    return recalculated;
  },

  async checkBreaches() {
    const now = new Date();
    const tickets = await ticketRepository.findSlaBreachedCandidates(now);

    if (tickets.length === 0) {
      return {
        checkedAt: now,
        breached: 0,
        notified: 0
      };
    }

    await ticketRepository.markSlaBreached(tickets.map((ticket) => ticket.id));

    const admins = await userRepository.findActiveAdmins();
    let notified = 0;

    for (const ticket of tickets) {
      const recipients = [ticket.assignedTechnician, ...admins].filter(Boolean);
      const result = await notificationService.notifySlaBreach(ticket, recipients);
      notified += result.count;
    }

    await auditLogRepository.createMany(tickets.map((ticket) => ({
      action: SLA_BREACH_ACTION,
      entity: 'Ticket',
      entityId: ticket.id,
      userId: null,
      previousValue: { slaBreached: false },
      newValue: { slaBreached: true },
      details: {
        slaId: ticket.slaId,
        slaDeadline: ticket.slaDeadline,
        assignedTechnicianId: ticket.assignedTechnicianId,
        detectedAt: now
      }
    })));

    return {
      checkedAt: now,
      breached: tickets.length,
      notified
    };
  }
};

module.exports = { slaService };
