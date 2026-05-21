const { prisma } = require('../config/database');
const { auditRepository } = require('../repositories/audit.repository');
const { auditService } = require('./audit.service');
const { kpiService } = require('./kpi.service');
const { BadRequestError } = require('../utils/errors');
const { exportCsv } = require('../utils/csvExporter.util');
const { exportExcel } = require('../utils/excelExporter.util');
const { exportPdf } = require('../utils/pdfExporter.util');

const stringify = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const flattenRows = (data, prefix = '') => {
  if (Array.isArray(data)) return data.map((item) => ({ ...item }));

  const rows = [];
  Object.entries(data || {}).forEach(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item) => rows.push({ metric: label, ...item }));
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      rows.push(...flattenRows(value, label));
    } else {
      rows.push({ metric: label, value });
    }
  });
  return rows;
};

const columnsFromRows = (rows) => {
  const keys = Array.from(rows.reduce((acc, row) => {
    Object.keys(row).forEach((key) => acc.add(key));
    return acc;
  }, new Set()));

  return keys.map((key) => ({
    header: key,
    value: (row) => stringify(row[key])
  }));
};

const buildTicketWhere = (filters = {}) => kpiService.buildTicketWhere({
  ...filters,
  dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
  dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
});

const getTicketsRows = async (filters = {}) => {
  const tickets = await prisma.ticket.findMany({
    where: buildTicketWhere(filters),
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      subcategory: true,
      client: true,
      assignedTechnician: true,
      sla: true
    }
  });

  return tickets.map((ticket) => ({
    code: ticket.code,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category?.name,
    subcategory: ticket.subcategory?.name,
    client: ticket.client?.email,
    technician: ticket.assignedTechnician?.email,
    slaDeadline: ticket.slaDeadline,
    slaBreached: ticket.slaBreached,
    rating: ticket.rating,
    createdAt: ticket.createdAt
  }));
};

const getSlaRows = async (filters = {}) => {
  const tickets = await prisma.ticket.findMany({
    where: {
      ...buildTicketWhere(filters),
      slaId: { not: null }
    },
    orderBy: { slaDeadline: 'asc' },
    include: {
      sla: true,
      client: true,
      assignedTechnician: true
    }
  });

  return tickets.map((ticket) => ({
    ticketCode: ticket.code,
    slaName: ticket.sla?.name,
    slaVersion: ticket.sla?.version,
    slaSource: ticket.slaSource,
    slaDeadline: ticket.slaDeadline,
    slaBreached: ticket.slaBreached,
    client: ticket.client?.email,
    technician: ticket.assignedTechnician?.email,
    status: ticket.status
  }));
};

const getAuditRows = async (filters = {}) => auditRepository.findForExport({
  where: {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.result ? { result: filters.result } : {}),
    ...(filters.dateFrom || filters.dateTo ? {
      createdAt: {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {})
      }
    } : {})
  }
});

const buildReportRows = async ({ reportType, filters = {} }) => {
  if (reportType === 'KPI_OVERVIEW') return flattenRows(await kpiService.overview(filters));
  if (reportType === 'TICKETS') return getTicketsRows(filters);
  if (reportType === 'SLA') return getSlaRows(filters);
  if (reportType === 'AUDIT') return getAuditRows(filters);
  throw new BadRequestError('Tipo de reporte no soportado');
};

const buildFile = async ({ reportType, rows, format }) => {
  const columns = columnsFromRows(rows);
  const title = `Reporte ${reportType}`;

  if (format === 'CSV') {
    return {
      buffer: Buffer.from(exportCsv({
        metadata: [`${title} generado ${new Date().toISOString()}`],
        columns,
        rows
      }), 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv'
    };
  }

  if (format === 'EXCEL') {
    return {
      buffer: Buffer.from(exportExcel({ title, columns, rows }), 'utf8'),
      contentType: 'application/vnd.ms-excel; charset=utf-8',
      extension: 'xls'
    };
  }

  if (format === 'PDF') {
    return {
      buffer: await exportPdf({ title, columns, rows }),
      contentType: 'application/pdf',
      extension: 'pdf'
    };
  }

  throw new BadRequestError('Formato de reporte no soportado');
};

const reportExportService = {
  async generate({ reportType, filters = {}, format = 'CSV' }, user, context = {}) {
    const rows = await buildReportRows({ reportType, filters });

    if (!rows.length) {
      throw new BadRequestError('No hay datos para exportar');
    }

    const file = await buildFile({ reportType, rows, format });
    const generatedAt = new Date();

    await auditService.logEvent({
      userId: user?.id || null,
      action: 'REPORT_EXPORTED',
      entity: 'Report',
      entityId: null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: {
        reportType,
        format,
        filters,
        rowCount: rows.length,
        generatedAt
      }
    });

    return {
      ...file,
      rows,
      filename: `${reportType.toLowerCase()}-${generatedAt.toISOString().replace(/[:.]/g, '-')}.${file.extension}`
    };
  },

  buildReportRows,
  buildFile
};

module.exports = { reportExportService };
