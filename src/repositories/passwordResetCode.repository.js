const { prisma } = require('../config/database');

const passwordResetCodeRepository = {
  async invalidateActiveByUserId(userId) {
    return prisma.passwordResetCode.updateMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        usedAt: new Date()
      }
    });
  },

  async create(data) {
    return prisma.passwordResetCode.create({
      data
    });
  },

  async findValidByUserAndHash({ userId, codeHash }) {
    return prisma.passwordResetCode.findFirst({
      where: {
        userId,
        codeHash,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async markUsed(id) {
    return prisma.passwordResetCode.update({
      where: { id },
      data: {
        usedAt: new Date()
      }
    });
  }
};

module.exports = { passwordResetCodeRepository };
