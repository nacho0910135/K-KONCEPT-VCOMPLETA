const { prisma } = require('../config/database');

const evidenceInclude = {
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  ticket: {
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true
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
  }
};

const evidenceRepository = {
  createMany(evidenceItems) {
    return prisma.$transaction(evidenceItems.map((data) => (
      prisma.ticketEvidence.create({
        data,
        include: evidenceInclude
      })
    )));
  },

  findByTicketId(ticketId) {
    return prisma.ticketEvidence.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: evidenceInclude
    });
  },

  findById(id) {
    return prisma.ticketEvidence.findUnique({
      where: { id },
      include: evidenceInclude
    });
  },

  deleteById(id) {
    return prisma.$transaction(async (tx) => (
      tx.ticketEvidence.delete({
        where: { id },
        include: evidenceInclude
      })
    ));
  }
};

module.exports = { evidenceRepository };
