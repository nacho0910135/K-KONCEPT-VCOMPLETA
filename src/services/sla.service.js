const { auditLogRepository } = require('../repositories/auditLog.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { userRepository } = require('../repositories/user.repository');
const { notificationService } = require('./notification.service');

const slaService = {
  async calculateDeadlineForTicket({ priority }) {
    const hoursByPriority = {
      LOW: 72,
      MEDIUM: 48,
      HIGH: 24,
      CRITICAL: 4
    };

    return {
      slaDeadline: new Date(Date.now() + (hoursByPriority[priority] || 48) * 60 * 60 * 1000),
      slaSource: 'PRIORITY'
    };
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
      const recipients = [ticket.assignedTechnician, ...admins];
      const result = await notificationService.notifySlaBreach(ticket, recipients);
      notified += result.count;
    }

    await auditLogRepository.createMany(tickets.map((ticket) => ({
      action: 'SLA_BREACH_DETECTED',
      entity: 'Ticket',
      entityId: ticket.id,
      userId: null,
      metadata: {
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
