const { chatRepository } = require('../repositories/chat.repository');
const { ForbiddenError } = require('../utils/errors');

const canChat = (user) => ['ADMIN', 'TECHNICIAN'].includes(user.role);
const onlineCutoffMs = 60 * 1000;

const withOnline = (user, selfId) => ({
  ...user,
  online: user.id === selfId || (user.chatLastSeenAt && Date.now() - new Date(user.chatLastSeenAt).getTime() < onlineCutoffMs)
});

const chatService = {
  async users(user) {
    if (!canChat(user)) throw new ForbiddenError('Chat disponible solo para administradores y tecnicos');
    await chatRepository.touch(user.id);
    const users = await chatRepository.users();
    return users.filter((item) => item.id !== user.id).map((item) => withOnline(item, user.id));
  },

  async messages(user, peerId) {
    if (!canChat(user)) throw new ForbiddenError('Chat disponible solo para administradores y tecnicos');
    await chatRepository.touch(user.id);
    await chatRepository.markRead(user.id, peerId);
    return chatRepository.messages(user.id, peerId);
  },

  async send(user, payload) {
    if (!canChat(user)) throw new ForbiddenError('Chat disponible solo para administradores y tecnicos');
    await chatRepository.touch(user.id);
    return chatRepository.create({ senderId: user.id, ...payload });
  },

  async unread(user) {
    if (!canChat(user)) throw new ForbiddenError('Chat disponible solo para administradores y tecnicos');
    await chatRepository.touch(user.id);
    return chatRepository.unread(user.id);
  }
};

module.exports = { chatService };
