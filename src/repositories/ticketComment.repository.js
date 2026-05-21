const { prisma } = require('../config/database');

const ticketCommentRepository = {
  create(data) {
    return prisma.ticketComment.create({
      data,
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
    });
  },

  findByTicketId(ticketId) {
    return prisma.ticketComment.findMany({
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
    });
  }
};

module.exports = { ticketCommentRepository };
