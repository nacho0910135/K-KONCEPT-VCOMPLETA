const { prisma } = require('../config/database');

const appointmentInclude = {
  ticket: {
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true
        }
      },
      assignedTechnician: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  },
  technician: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
};

const appointmentRepository = {
  create(data) {
    return prisma.appointment.create({
      data,
      include: appointmentInclude
    });
  },

  findById(id) {
    return prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude
    });
  },

  findLatestActiveByTicketId(ticketId) {
    return prisma.appointment.findFirst({
      where: {
        ticketId,
        status: {
          in: ['SCHEDULED', 'RESCHEDULED']
        }
      },
      orderBy: { appointmentDate: 'desc' },
      include: appointmentInclude
    });
  },

  findOverlapping({ technicianId, start, end, slotMinutes, excludeId }) {
    return prisma.appointment.findFirst({
      where: {
        technicianId,
        status: {
          in: ['SCHEDULED', 'RESCHEDULED']
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        appointmentDate: {
          lt: end,
          gt: new Date(start.getTime() - slotMinutes * 60 * 1000)
        }
      },
      include: appointmentInclude
    });
  },

  findActiveForDay({ technicianId, dayStart, dayEnd }) {
    return prisma.appointment.findMany({
      where: {
        technicianId,
        status: {
          in: ['SCHEDULED', 'RESCHEDULED']
        },
        appointmentDate: {
          gte: dayStart,
          lt: dayEnd
        }
      },
      orderBy: { appointmentDate: 'asc' },
      include: appointmentInclude
    });
  },

  update(id, data) {
    return prisma.appointment.update({
      where: { id },
      data,
      include: appointmentInclude
    });
  }
};

module.exports = { appointmentRepository };
