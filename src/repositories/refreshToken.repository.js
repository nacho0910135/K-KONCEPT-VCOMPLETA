const { prisma } = require('../config/database');
const { publicUserSelect } = require('./auth.repository');

const refreshTokenRepository = {
  create({ userId, tokenHash, expiresAt }) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  },

  findValidByHash(tokenHash) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revoked: true,
        user: {
          select: publicUserSelect
        }
      }
    });
  },

  revokeById(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revoked: true }
    });
  },

  revokeByHash(tokenHash) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revoked: false
      },
      data: { revoked: true }
    });
  },

  revokeAllByUserId(userId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false
      },
      data: { revoked: true }
    });
  }
};

module.exports = { refreshTokenRepository };
