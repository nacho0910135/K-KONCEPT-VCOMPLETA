const { prisma } = require('../config/database');

const userSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  phone: true,
  company: true,
  active: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  company: true,
  active: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true
};

const authRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: userSelect
    });
  },

  findActiveById(id) {
    return prisma.user.findFirst({
      where: {
        id,
        active: true
      },
      select: publicUserSelect
    });
  },

  createClientUser(data) {
    return prisma.user.create({
      data: {
        ...data,
        role: 'CLIENT'
      },
      select: publicUserSelect
    });
  },

  updateLastLogin(id) {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
      select: publicUserSelect
    });
  }
};

module.exports = { authRepository, publicUserSelect };
