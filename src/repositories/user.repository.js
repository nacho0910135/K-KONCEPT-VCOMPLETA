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

  async findLeastBusyActiveTechnician({ openStatuses = [] } = {}) {
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        active: true
      },
      select: publicUserSelect,
      orderBy: { createdAt: 'asc' }
    });

    if (technicians.length === 0) return null;

    const workloads = openStatuses.length
      ? await prisma.ticket.groupBy({
          by: ['assignedTechnicianId'],
          where: {
            assignedTechnicianId: { in: technicians.map((technician) => technician.id) },
            status: { in: openStatuses }
          },
          _count: { _all: true }
        })
      : [];

    const workloadByTechnician = new Map(workloads.map((item) => [item.assignedTechnicianId, item._count._all]));

    return technicians
      .map((technician) => ({
        ...technician,
        activeTicketCount: workloadByTechnician.get(technician.id) || 0
      }))
      .sort((left, right) => left.activeTicketCount - right.activeTicketCount || left.createdAt - right.createdAt)[0];
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
