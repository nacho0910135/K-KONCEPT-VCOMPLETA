const { prisma } = require('../config/database');
const { ticketInclude } = require('./ticketCounter.repository');

const ticketRepository = {
  findById(id) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        ...ticketInclude,
        replacements: true
      }
    });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take,
        include: ticketInclude
      })
    ]);
  },

  search({ where, orderBy, skip, take }) {
    return this.list({ where, orderBy, skip, take });
  },

  update(id, data) {
    return prisma.ticket.update({
      where: { id },
      data,
      include: ticketInclude
    });
  },

  deleteById(id) {
    return prisma.ticket.delete({
      where: { id },
      include: ticketInclude
    });
  },

  updateStatusWithHistory(id, data, history) {
    return prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        statusHistories: {
          create: history
        }
      },
      include: ticketInclude
    });
  },

  assignTechnician(id, technicianId, history, status, extraData = {}) {
    return prisma.ticket.update({
      where: { id },
      data: {
        ...extraData,
        assignedTechnicianId: technicianId,
        ...(status ? { status } : {}),
        statusHistories: history ? { create: history } : undefined
      },
      include: ticketInclude
    });
  },

  findDeliveredReplacement(ticketId) {
    return prisma.replacement.findFirst({
      where: {
        ticketId,
        status: 'DELIVERED'
      }
    });
  },

  findValidWarranty({ productId, clientId }) {
    return prisma.warranty.findFirst({
      where: {
        productId,
        clientId,
        status: 'VALID',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });
  },

  getChronologicalHistory(ticketId) {
    return Promise.all([
      prisma.ticketStatusHistory.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.ticketComment.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.ticketEvidence.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })
    ]);
  },

  findResolvedInactiveBefore(cutoffDate) {
    return prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        updatedAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });
  },

  closeResolvedTickets(ticketIds, systemUserId, comment) {
    if (ticketIds.length === 0) return [];

    return prisma.$transaction(async (tx) => {
      const tickets = await tx.ticket.findMany({
        where: {
          id: { in: ticketIds },
          status: 'RESOLVED'
        },
        select: {
          id: true,
          status: true
        }
      });

      await tx.ticket.updateMany({
        where: {
          id: { in: tickets.map((ticket) => ticket.id) },
          status: 'RESOLVED'
        },
        data: {
          status: 'CLOSED'
        }
      });

      await tx.ticketStatusHistory.createMany({
        data: tickets.map((ticket) => ({
          ticketId: ticket.id,
          previousStatus: ticket.status,
          newStatus: 'CLOSED',
          changedById: systemUserId,
          comment
        }))
      });

      return tickets;
    });
  },

  findSlaBreachedCandidates(now) {
    return prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED']
        },
        slaDeadline: {
          lt: now
        },
        slaBreached: false
      },
      include: {
        assignedTechnician: true
      }
    });
  },

  markSlaBreached(ticketIds) {
    if (ticketIds.length === 0) return { count: 0 };

    return prisma.ticket.updateMany({
      where: {
        id: { in: ticketIds },
        slaBreached: false
      },
      data: {
        slaBreached: true
      }
    });
  },

  findOpenTicketsForSlaRecalculation() {
    return prisma.ticket.findMany({
      where: {
        status: {
          notIn: ['CLOSED', 'CANCELLED']
        }
      },
      select: {
        id: true,
        priority: true,
        categoryId: true,
        clientId: true,
        createdAt: true
      }
    });
  }
};

module.exports = { ticketRepository };
