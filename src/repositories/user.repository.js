const { prisma } = require('../config/database');

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

const userRepository = {
  findSystemUser() {
    return prisma.user.findUnique({
      where: { email: 'system@kollabkoncepts.internal' }
    });
  },

  findActiveAdmins() {
    return prisma.user.findMany({
      where: {
        role: 'ADMIN',
        active: true
      }
    });
  },

  findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect
    });
  },

  findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect
    });
  },

  findActiveTechnicianById(id) {
    return prisma.user.findFirst({
      where: {
        id,
        role: 'TECHNICIAN',
        active: true
      },
      select: publicUserSelect
    });
  },

  findActiveClientById(id) {
    return prisma.user.findFirst({
      where: {
        id,
        role: 'CLIENT',
        active: true
      },
      select: publicUserSelect
    });
  },

  create(data) {
    return prisma.user.create({
      data,
      select: publicUserSelect
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: publicUserSelect
      })
    ]);
  },

  update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect
    });
  }
};

module.exports = { userRepository };
