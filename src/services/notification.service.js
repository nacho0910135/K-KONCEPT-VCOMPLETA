const { notificationRepository } = require('../repositories/notification.repository');

const notificationService = {
  async notifyUsers({ event, title, message, recipients, entityType, entityId, channel = 'IN_APP' }) {
    const uniqueRecipients = new Map();

    recipients.filter(Boolean).forEach((recipient) => {
      uniqueRecipients.set(recipient.id, recipient);
    });

    return notificationRepository.createMany(Array.from(uniqueRecipients.values()).map((recipient) => ({
      event,
      title,
      message,
      userId: recipient.id,
      entityType,
      entityId,
      channel,
      sentAt: new Date()
    })));
  },

  async notifySlaBreach(ticket, recipients) {
    const uniqueRecipients = new Map();

    recipients.filter(Boolean).forEach((recipient) => {
      uniqueRecipients.set(recipient.id, recipient);
    });

    const notifications = Array.from(uniqueRecipients.values()).map((recipient) => ({
      event: 'SLA_BREACH',
      title: 'SLA vencido',
      message: `El ticket "${ticket.title}" excedio su fecha limite de SLA.`,
      userId: recipient.id,
      entityType: 'Ticket',
      entityId: ticket.id,
      channel: 'IN_APP',
      sentAt: new Date()
    }));

    return notificationRepository.createMany(notifications);
  }
};

module.exports = { notificationService };
