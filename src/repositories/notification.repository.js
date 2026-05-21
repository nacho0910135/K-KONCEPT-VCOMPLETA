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

  countUnread(userId) {
    return prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  },

  countSentSince({ userId, event, since }) {
    return prisma.notification.count({
      where: {
        userId,
        event,
        sentAt: { gte: since }
      }
    });
  }
};

module.exports = { notificationRepository };
