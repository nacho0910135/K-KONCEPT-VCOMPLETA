const crypto = require('crypto');
const { prisma } = require('../config/database');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  chatLastSeenAt: true
};

const messageSelect = {
  id: true,
  senderId: true,
  recipientId: true,
  body: true,
  attachmentUrl: true,
  attachmentType: true,
  readAt: true,
  createdAt: true
};

const chatRepository = {
  touch(userId) {
    return prisma.user.update({ where: { id: userId }, data: { chatLastSeenAt: new Date() }, select: { id: true } });
  },

  users() {
    return prisma.user.findMany({
      where: { active: true, role: { in: ['ADMIN', 'TECHNICIAN'] } },
      select: userSelect,
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });
  },

  messages(userId, peerId) {
    return prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: peerId },
          { senderId: peerId, recipientId: userId }
        ]
      },
      select: messageSelect,
      orderBy: { createdAt: 'asc' },
      take: 80
    });
  },

  create({ senderId, recipientId, body, attachmentUrl, attachmentType }) {
    return prisma.chatMessage.create({
      data: {
        id: crypto.randomUUID(),
        senderId,
        recipientId,
        body: body || null,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null
      },
      select: messageSelect
    });
  },

  markRead(userId, peerId) {
    return prisma.chatMessage.updateMany({
      where: { senderId: peerId, recipientId: userId, readAt: null },
      data: { readAt: new Date() }
    });
  },

  unread(userId) {
    return prisma.chatMessage.findMany({
      where: { recipientId: userId, readAt: null },
      select: messageSelect,
      orderBy: { createdAt: 'desc' }
    });
  }
};

module.exports = { chatRepository };
