const { prisma } = require('../config/database');

const notificationConfigRepository = {
  findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true
      }
    });
  },

  findActiveAdmins() {
    return prisma.user.findMany({
      where: {
        role: 'ADMIN',
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });
  },

  listChannels() {
    return prisma.notificationChannelsConfig.findMany({
      orderBy: { channel: 'asc' }
    });
  },

  upsertChannel({ channel, enabled, config }) {
    return prisma.notificationChannelsConfig.upsert({
      where: { channel },
      update: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(config !== undefined ? { config } : {})
      },
      create: {
        channel,
        enabled: enabled ?? channel === 'IN_APP',
        config: config || {}
      }
    });
  },

  findActiveTemplate({ event, channel }) {
    return prisma.notificationTemplate.findFirst({
      where: {
        event,
        channel,
        active: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  createTemplate(data) {
    return prisma.notificationTemplate.create({ data });
  },

  listTemplates(where) {
    return prisma.notificationTemplate.findMany({
      where,
      orderBy: [
        { event: 'asc' },
        { channel: 'asc' }
      ]
    });
  },

  findTemplateById(id) {
    return prisma.notificationTemplate.findUnique({ where: { id } });
  },

  updateTemplate(id, data) {
    return prisma.notificationTemplate.update({
      where: { id },
      data
    });
  },

  findFrequencyRule(event) {
    return prisma.notificationFrequencyRule.findFirst({
      where: {
        event,
        active: true
      }
    });
  },

  createFrequencyRule(data) {
    return prisma.notificationFrequencyRule.create({ data });
  },

  listFrequencyRules() {
    return prisma.notificationFrequencyRule.findMany({
      orderBy: { event: 'asc' }
    });
  },

  findFrequencyRuleById(id) {
    return prisma.notificationFrequencyRule.findUnique({ where: { id } });
  },

  updateFrequencyRule(id, data) {
    return prisma.notificationFrequencyRule.update({
      where: { id },
      data
    });
  }
};

module.exports = { notificationConfigRepository };
