const { prisma } = require('../config/database');

const refundInclude = {
  ticket: {
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
      product: true
    }
  },
  requestedBy: { select: { id: true, name: true, email: true, role: true } }
};

const refundRepository = {
  create(data) {
    return prisma.refund.create({ data, include: refundInclude });
  },

  findByTicketId(ticketId) {
    return prisma.refund.findMany({ where: { ticketId }, orderBy: { createdAt: 'desc' }, include: refundInclude });
  },

  list(where = {}) {
    return prisma.refund.findMany({ where, orderBy: { createdAt: 'desc' }, include: refundInclude });
  }
};

module.exports = { refundRepository };
