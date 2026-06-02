const { Prisma } = require('@prisma/client');

const { prisma } = require('../config/database');
const { withTransactionRetry } = require('../utils/prismaTransaction.util');

const formatTicketCode = (year, count) => `TK-${year}-${String(count).padStart(4, '0')}`;

const ticketCounterRepository = {
  async createTicketWithSequentialCode(ticketData) {
    const year = new Date().getFullYear();

    return withTransactionRetry(() => (
      prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
          SELECT * FROM "TicketCounters" WHERE "year" = ${year} FOR UPDATE
        `;

        let newCount;

        if (rows.length === 0) {
          newCount = 1;
          await tx.ticketCounter.create({
            data: {
              id: `TICKET_COUNTER_${year}`,
              year,
              count: newCount
            }
          });
        } else {
          newCount = rows[0].count + 1;
          await tx.$executeRaw`
            UPDATE "TicketCounters"
            SET "count" = ${newCount}, "updatedAt" = NOW()
            WHERE "year" = ${year}
          `;
        }

        const code = formatTicketCode(year, newCount);

        return tx.ticket.create({
          data: {
            ...ticketData,
            code,
            statusHistories: {
              create: {
                previousStatus: null,
                newStatus: 'OPEN',
                changedById: ticketData.clientId,
                comment: 'Ticket creado por cliente'
              }
            }
          },
          include: ticketInclude
        });
      }, {
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      })
    ), { retries: 4, baseDelayMs: 100, maxDelayMs: 1000 });
  }
};

const ticketInclude = {
  category: true,
  subcategory: true,
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
      phone: true,
      company: true
    }
  },
  product: true,
  warranty: true,
  sla: true,
  evidence: {
    orderBy: { createdAt: 'desc' },
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
  },
  comments: {
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
  },
  statusHistories: {
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
  }
};

module.exports = { ticketCounterRepository, formatTicketCode, ticketInclude };
