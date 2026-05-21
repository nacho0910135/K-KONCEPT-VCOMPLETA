const { auditRepository } = require('../repositories/audit.repository');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { exportCsv } = require('../utils/csvExporter.util');
const { calculateDiff } = require('../utils/diffCalculator.util');
const { NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const normalizeEntry = (entry) => ({
  result: 'SUCCESS',
  ...entry,
  details: entry.details || entry.metadata || null
});

const enqueueAudit = (entry) => {
  setImmediate(() => {
    auditRepository.create(normalizeEntry(entry)).catch((error) => {
      logger.error({ error, entry }, 'No se pudo registrar audit log');
    });
  });
};

const buildWhere = (query) => ({
  ...(query.userId ? { userId: query.userId } : {}),
  ...(query.action ? { action: query.action } : {}),
  ...(query.entity ? { entity: query.entity } : {}),
  ...(query.result ? { result: query.result } : {}),
  ...(query.from || query.to ? {
    createdAt: {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {})
    }
  } : {})
});

const auditService = {
  logEvent(entry) {
    enqueueAudit(entry);
    return Promise.resolve({ queued: true });
  },

  record(entry) {
    return this.logEvent({ result: 'SUCCESS', ...entry });
  },

  recordFailure(entry) {
    return this.logEvent({ result: 'FAILURE', ...entry });
  },

  async createMany(entries) {
    return auditRepository.createMany(entries.map(normalizeEntry));
  },

  async list(query) {
    const pagination = buildPagination({ ...query, sortBy: query.sortBy || 'createdAt', sortOrder: 'desc' });
    const where = buildWhere(query);
    const [total, items] = await auditRepository.list({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async getById(id) {
    const log = await auditRepository.findById(id);
    if (!log) throw new NotFoundError('Registro de auditoria no encontrado');

    const correlated = await auditRepository.findCorrelated({
      userId: log.userId,
      createdAt: log.createdAt,
      excludeId: log.id
    });

    return {
      ...log,
      diff: calculateDiff(log.previousValue || {}, log.newValue || {}),
      correlated
    };
  },

  async export(query, user, context = {}) {
    const where = buildWhere(query);
    const rows = await auditRepository.findForExport({ where });
    const exportedAt = new Date();

    await this.logEvent({
      userId: user.id,
      action: 'AUDIT_EXPORTED',
      entity: 'AuditLog',
      entityId: null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: {
        filters: query,
        rowCount: rows.length,
        exportedAt
      }
    });

    const csv = exportCsv({
      metadata: [
        `Audit export generated at ${exportedAt.toISOString()}`,
        `Rows ${rows.length}`
      ],
      columns: [
        { header: 'createdAt', value: (row) => row.createdAt.toISOString() },
        { header: 'userId', value: 'userId' },
        { header: 'userEmail', value: (row) => row.user?.email || '' },
        { header: 'action', value: 'action' },
        { header: 'entity', value: 'entity' },
        { header: 'entityId', value: 'entityId' },
        { header: 'result', value: 'result' },
        { header: 'ipAddress', value: 'ipAddress' },
        { header: 'details', value: (row) => JSON.stringify(row.details || {}) }
      ],
      rows
    });

    return { csv, exportedAt, count: rows.length };
  }
};

module.exports = { auditService, buildWhere };
