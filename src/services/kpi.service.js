const { prisma } = require('../config/database');

const KPI_CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const CLOSED_STATUSES = ['CLOSED', 'CANCELLED'];
const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED'];

const serializeFilters = (filters = {}) => JSON.stringify(Object.keys(filters).sort().reduce((acc, key) => {
  acc[key] = filters[key] instanceof Date ? filters[key].toISOString() : filters[key];
  return acc;
}, {}));

const withCache = async (key, producer) => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await producer();
  cache.set(key, { value, expiresAt: Date.now() + KPI_CACHE_TTL_MS });
  return value;
};

const toDate = (value) => {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
};

const buildTicketWhere = (filters = {}) => {
  const dateFrom = toDate(filters.dateFrom);
  const dateTo = toDate(filters.dateTo);

  return {
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {})
      }
    } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.technicianId ? { assignedTechnicianId: filters.technicianId } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {})
  };
};

const normalizeGroupRows = (rows, key) => rows.map((row) => ({
  [key]: row[key],
  count: row._count._all
}));

const averageHours = (items) => {
  if (items.length === 0) return 0;
  const totalMs = items.reduce((sum, item) => sum + Math.max(0, item.to.getTime() - item.from.getTime()), 0);
  return Number((totalMs / items.length / 60 / 60 / 1000).toFixed(2));
};

const getFirstHistoryDurations = async ({ filters, statuses }) => {
  const histories = await prisma.ticketStatusHistory.findMany({
    where: {
      newStatus: { in: statuses },
      ticket: buildTicketWhere(filters)
    },
    orderBy: { createdAt: 'asc' },
    include: {
      ticket: {
        select: {
          id: true,
          createdAt: true
        }
      }
    }
  });

  const firstByTicket = new Map();
  histories.forEach((history) => {
    if (!firstByTicket.has(history.ticketId)) {
      firstByTicket.set(history.ticketId, {
        from: history.ticket.createdAt,
        to: history.createdAt
      });
    }
  });

  return Array.from(firstByTicket.values());
};

const kpiService = {
  buildTicketWhere,

  ticketsByStatus(filters = {}) {
    return withCache(`ticketsByStatus:${serializeFilters(filters)}`, async () => {
      const rows = await prisma.ticket.groupBy({
        by: ['status'],
        where: buildTicketWhere(filters),
        _count: { _all: true }
      });
      return normalizeGroupRows(rows, 'status');
    });
  },

  ticketsByPriority(filters = {}) {
    return withCache(`ticketsByPriority:${serializeFilters(filters)}`, async () => {
      const rows = await prisma.ticket.groupBy({
        by: ['priority'],
        where: buildTicketWhere(filters),
        _count: { _all: true }
      });
      return normalizeGroupRows(rows, 'priority');
    });
  },

  ticketsByCategory(filters = {}) {
    return withCache(`ticketsByCategory:${serializeFilters(filters)}`, async () => {
      const rows = await prisma.ticket.groupBy({
        by: ['categoryId', 'subcategoryId'],
        where: buildTicketWhere(filters),
        _count: { _all: true }
      });

      const categories = await prisma.category.findMany({ select: { id: true, name: true } });
      const subcategories = await prisma.subcategory.findMany({ select: { id: true, name: true } });
      const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
      const subcategoryNames = new Map(subcategories.map((subcategory) => [subcategory.id, subcategory.name]));

      return rows.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryNames.get(row.categoryId) || null,
        subcategoryId: row.subcategoryId,
        subcategoryName: row.subcategoryId ? subcategoryNames.get(row.subcategoryId) || null : null,
        count: row._count._all
      }));
    });
  },

  ticketsByTechnician(filters = {}) {
    return withCache(`ticketsByTechnician:${serializeFilters(filters)}`, async () => {
      const tickets = await prisma.ticket.findMany({
        where: buildTicketWhere(filters),
        select: {
          assignedTechnicianId: true,
          status: true,
          assignedTechnician: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const grouped = new Map();
      tickets.forEach((ticket) => {
        const key = ticket.assignedTechnicianId || 'UNASSIGNED';
        const current = grouped.get(key) || {
          technicianId: ticket.assignedTechnicianId,
          technicianName: ticket.assignedTechnician?.name || 'Sin asignar',
          assigned: 0,
          resolved: 0,
          open: 0
        };

        current.assigned += 1;
        if (RESOLVED_STATUSES.includes(ticket.status)) current.resolved += 1;
        if (!CLOSED_STATUSES.includes(ticket.status)) current.open += 1;
        grouped.set(key, current);
      });

      return Array.from(grouped.values());
    });
  },

  async avgResponseTime(filters = {}) {
    return withCache(`avgResponseTime:${serializeFilters(filters)}`, async () => ({
      averageHours: averageHours(await getFirstHistoryDurations({ filters, statuses: ['IN_PROGRESS'] }))
    }));
  },

  async avgResolutionTime(filters = {}) {
    return withCache(`avgResolutionTime:${serializeFilters(filters)}`, async () => ({
      averageHours: averageHours(await getFirstHistoryDurations({ filters, statuses: RESOLVED_STATUSES }))
    }));
  },

  async slaCompliance(filters = {}) {
    return withCache(`slaCompliance:${serializeFilters(filters)}`, async () => {
      const total = await prisma.ticket.count({ where: buildTicketWhere(filters) });
      const breached = await prisma.ticket.count({ where: { ...buildTicketWhere(filters), slaBreached: true } });
      const compliant = total - breached;
      return {
        total,
        compliant,
        breached,
        complianceRate: total ? Number(((compliant / total) * 100).toFixed(2)) : 0
      };
    });
  },

  async reopenedRate(filters = {}) {
    return withCache(`reopenedRate:${serializeFilters(filters)}`, async () => {
      const total = await prisma.ticket.count({ where: buildTicketWhere(filters) });
      const reopened = await prisma.ticket.count({ where: { ...buildTicketWhere(filters), status: 'REOPENED' } });
      return {
        total,
        reopened,
        reopenedRate: total ? Number(((reopened / total) * 100).toFixed(2)) : 0
      };
    });
  },

  async ratingSummary(filters = {}) {
    return withCache(`ratingSummary:${serializeFilters(filters)}`, async () => {
      const where = {
        ...buildTicketWhere(filters),
        rating: { not: null }
      };
      const aggregate = await prisma.ticket.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true }
      });
      const distribution = await this.ratingsDistribution(filters);
      return {
        average: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0,
        count: aggregate._count.rating,
        distribution
      };
    });
  },

  async ratingsDistribution(filters = {}) {
    return withCache(`ratingsDistribution:${serializeFilters(filters)}`, async () => {
      const rows = await prisma.ticket.groupBy({
        by: ['rating'],
        where: {
          ...buildTicketWhere(filters),
          rating: { not: null }
        },
        _count: { _all: true },
        orderBy: { rating: 'asc' }
      });

      const counts = new Map(rows.map((row) => [row.rating, row._count._all]));
      return [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: counts.get(rating) || 0
      }));
    });
  },

  async replacementVsRepair(filters = {}) {
    return withCache(`replacementVsRepair:${serializeFilters(filters)}`, async () => {
      const replacements = await prisma.replacement.count({
        where: {
          ticket: buildTicketWhere(filters)
        }
      });
      const repairs = await prisma.ticket.count({
        where: {
          ...buildTicketWhere(filters),
          closeType: 'WITH_SOLUTION'
        }
      });

      return { replacements, repairs };
    });
  },

  async monthlyVolume(filters = {}) {
    return withCache(`monthlyVolume:${serializeFilters(filters)}`, async () => {
      const end = toDate(filters.dateTo) || new Date();
      const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
      const tickets = await prisma.ticket.findMany({
        where: {
          ...buildTicketWhere({ ...filters, dateFrom: start, dateTo: end })
        },
        select: { createdAt: true }
      });

      const buckets = new Map();
      for (let i = 0; i < 12; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
        buckets.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, 0);
      }

      tickets.forEach((ticket) => {
        const key = `${ticket.createdAt.getFullYear()}-${String(ticket.createdAt.getMonth() + 1).padStart(2, '0')}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      });

      return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
    });
  },

  async overview(filters = {}) {
    const [
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByTechnician,
      avgResponseTime,
      avgResolutionTime,
      slaCompliance,
      reopenedRate,
      ratingSummary,
      replacementVsRepair,
      monthlyVolume
    ] = await Promise.all([
      this.ticketsByStatus(filters),
      this.ticketsByPriority(filters),
      this.ticketsByCategory(filters),
      this.ticketsByTechnician(filters),
      this.avgResponseTime(filters),
      this.avgResolutionTime(filters),
      this.slaCompliance(filters),
      this.reopenedRate(filters),
      this.ratingSummary(filters),
      this.replacementVsRepair(filters),
      this.monthlyVolume(filters)
    ]);

    return {
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByTechnician,
      avgResponseTime,
      avgResolutionTime,
      slaCompliance,
      reopenedRate,
      ratingSummary,
      replacementVsRepair,
      monthlyVolume
    };
  }
};

module.exports = { kpiService };
