const { prisma } = require('../config/database');

const notificationRepository = {
  createMany(notifications) {
    if (notifications.length === 0) return { count: 0 };

    return prisma.notification.createMany({
      data: notifications,
      skipDuplicates: false
    });
  }
};

module.exports = { notificationRepository };
