const { notificationRepository } = require('../../repositories/notification.repository');

const inAppProvider = {
  async sendNotification(to, subject, body, metadata = {}) {
    const notification = await notificationRepository.create({
      userId: to.id,
      event: metadata.event,
      title: subject || metadata.title || metadata.event,
      message: body,
      entityType: metadata.entityType,
      entityId: metadata.entityId,
      channel: 'IN_APP',
      sentAt: new Date()
    });

    return { persisted: true, notification };
  }
};

module.exports = { inAppProvider };
