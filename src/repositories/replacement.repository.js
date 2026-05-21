const { prisma } = require('../config/database');

const replacementInclude = {
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
          email: true,
          role: true
        }
      },
      product: true
    }
  },
  requestedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  deliveredBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  replacementProduct: true
};

const replacementRepository = {
  create(data) {
    return prisma.replacement.create({
      data,
      include: replacementInclude
    });
  },

  findById(id) {
    return prisma.replacement.findUnique({
      where: { id },
      include: replacementInclude
    });
  },

  findActiveByTicketId(ticketId) {
    return prisma.replacement.findFirst({
      where: {
        ticketId,
        status: {
          not: 'REJECTED'
        }
      },
      include: replacementInclude
    });
  },

  findByTicketId(ticketId) {
    return prisma.replacement.findFirst({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: replacementInclude
    });
  },

  update(id, data) {
    return prisma.replacement.update({
      where: { id },
      data,
      include: replacementInclude
    });
  },

  findProductBySerial(serialNumber) {
    return prisma.product.findUnique({
      where: { serialNumber }
    });
  },

  findProductById(id) {
    return prisma.product.findUnique({
      where: { id }
    });
  }
};

module.exports = { replacementRepository };
