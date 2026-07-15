const { prisma } = require('../config/database');

const notificationRepository = {
  create(data) {
    return prisma.notification.create({ data });
  },

  createMany(notifications) {
    if (notifications.length === 0) return { count: 0 };

    return prisma.notification.createMany({
      data: notifications,
      skipDuplicates: false
    });
  },

  findUserNotification({ id, userId }) {
    return prisma.notification.findFirst({
      where: { id, userId }
    });
  },

  listForUser({ userId, where, orderBy, skip, take }) {
    const mergedWhere = { ...where, userId };

    return prisma.$transaction([
      prisma.notification.count({ where: mergedWhere }),
      prisma.notification.findMany({
        where: mergedWhere,
        orderBy,
        skip,
        take
      })
    ]);
  },

  async listTicketEmails(ticketId) {
    const replacements = await prisma.replacement.findMany({
      where: { ticketId },
      select: { id: true }
    });
    const replacementIds = replacements.map((replacement) => replacement.id);

    return prisma.notification.findMany({
      where: {
        channel: 'EMAIL',
        OR: [
          { entityType: 'Ticket', entityId: ticketId },
          ...(replacementIds.length ? [{ entityType: 'Replacement', entityId: { in: replacementIds } }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  markRead({ id, userId }) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
  },

  markAllRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });
  },

  deleteForUser(userId) {
    return prisma.notification.deleteMany({
      where: { userId }
    });
  },

  countUnread(userId, where = {}) {
    return prisma.notification.count({
      where: {
        ...where,
        userId,
        read: false
      }
    });
  },

  countSentSince({ userId, event, channel, since }) {
    return prisma.notification.count({
      where: {
        userId,
        event,
        ...(channel ? { channel } : {}),
        sentAt: { gte: since }
      }
    });
  }
};

module.exports = { notificationRepository };
