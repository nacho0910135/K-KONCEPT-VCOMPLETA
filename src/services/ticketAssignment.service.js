const { appSettingRepository } = require('../repositories/appSetting.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const { slaService } = require('./sla.service');

const AUTO_ASSIGNMENT_KEY = 'ticket.assignment.automatic';
const AUTO_ASSIGNMENT_ONLINE_ONLY_KEY = 'ticket.assignment.onlineOnly';
const OPEN_WORKLOAD_STATUSES = ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'];
const ONLINE_CUTOFF_MS = 60 * 1000;
let assignmentQueue = Promise.resolve();

const parseEnabled = (value) => value === null ? true : value === 'true';
const runAssignmentExclusive = (fn) => {
  const run = assignmentQueue.then(fn, fn);
  // ponytail: process-local lock, use DB advisory locks if this runs on multiple Node instances.
  assignmentQueue = run.catch(() => {});
  return run;
};

const ticketAssignmentService = {
  async getSettings() {
    const [value, onlineOnlyValue] = await Promise.all([
      appSettingRepository.get(AUTO_ASSIGNMENT_KEY),
      appSettingRepository.get(AUTO_ASSIGNMENT_ONLINE_ONLY_KEY)
    ]);
    const automatic = parseEnabled(value);
    return {
      automatic,
      mode: automatic ? 'AUTOMATIC' : 'MANUAL',
      onlineOnly: parseEnabled(onlineOnlyValue)
    };
  },

  async updateSettings(payload, user) {
    const [saved, onlineOnlySaved] = await Promise.all([
      appSettingRepository.set(AUTO_ASSIGNMENT_KEY, payload.automatic ? 'true' : 'false'),
      payload.onlineOnly === undefined
        ? Promise.resolve({ value: String(parseEnabled(await appSettingRepository.get(AUTO_ASSIGNMENT_ONLINE_ONLY_KEY))) })
        : appSettingRepository.set(AUTO_ASSIGNMENT_ONLINE_ONLY_KEY, payload.onlineOnly ? 'true' : 'false')
    ]);
    const settings = {
      automatic: parseEnabled(saved.value),
      mode: parseEnabled(saved.value) ? 'AUTOMATIC' : 'MANUAL',
      onlineOnly: parseEnabled(onlineOnlySaved.value)
    };

    await auditService.record({
      userId: user.id,
      action: 'TICKET_ASSIGNMENT_MODE_UPDATED',
      entity: 'AppSettings',
      entityId: AUTO_ASSIGNMENT_KEY,
      newValue: settings
    });

    return settings;
  },

  assignIfEnabled(ticket, actor) {
    return runAssignmentExclusive(async () => {
      const settings = await this.getSettings();
      if (!settings.automatic || ticket.assignedTechnicianId) {
        return { ticket, assigned: false, settings };
      }

      const technician = await userRepository.findLeastBusyActiveTechnician({
        openStatuses: OPEN_WORKLOAD_STATUSES,
        onlineOnly: settings.onlineOnly,
        onlineCutoff: new Date(Date.now() - ONLINE_CUTOFF_MS)
      });

      if (!technician) {
        return { ticket, assigned: false, settings, reason: settings.onlineOnly ? 'NO_ONLINE_TECHNICIANS' : 'NO_ACTIVE_TECHNICIANS' };
      }

      const sla = await slaService.calculateDeadlineForTicket({
        priority: ticket.priority,
        categoryId: ticket.categoryId,
        clientId: ticket.clientId,
        createdAt: ticket.createdAt
      });

      const updated = await ticketRepository.assignTechnician(ticket.id, technician.id, {
        previousStatus: ticket.status,
        newStatus: 'PENDING',
        changedById: actor.id,
        comment: `Asignacion automatica a ${technician.name}`
      }, 'PENDING', {
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
        userId: actor.id,
        action: 'TICKET_AUTO_ASSIGNED',
        entity: 'Ticket',
        entityId: ticket.id,
        previousValue: { assignedTechnicianId: ticket.assignedTechnicianId },
        newValue: { assignedTechnicianId: technician.id }
      });

      return { ticket: updated, assigned: true, technician, settings };
    });
  }
};

module.exports = { ticketAssignmentService };
