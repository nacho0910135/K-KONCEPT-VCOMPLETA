const { prisma } = require('../config/database');
const { auditRepository } = require('../repositories/audit.repository');
const { auditService } = require('./audit.service');
const { kpiService } = require('./kpi.service');
const { BadRequestError } = require('../utils/errors');
const { exportCsv } = require('../utils/csvExporter.util');
const { exportExcel } = require('../utils/excelExporter.util');
const { exportPdf } = require('../utils/pdfExporter.util');
const PDFDocument = require('pdfkit');

const statusLabel = {
  OPEN: 'Abiertos',
  ASSIGNED: 'Asignados',
  PENDING: 'Pendientes',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando cliente',
  RESOLVED: 'Resueltos',
  CLOSED: 'Cerrados',
  CANCELLED: 'Cancelados',
  REOPENED: 'Reabiertos'
};
const priorityLabel = { CRITICAL: 'Critica', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
const replacementLabel = {
  PENDING_APPROVAL: 'Por validar',
  APPROVED: 'Aprobados',
  IN_TRANSIT: 'En transito',
  DELIVERED: 'Entregados',
  REJECTED: 'Rechazados'
};
const getCount = (rows = [], key, field = 'status') => rows.find((item) => item[field] === key)?.count || 0;
const pct = (value) => `${Number(value || 0).toFixed(0)}%`;
const money = (value) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value || 0);

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

const writeMetric = (doc, x, y, width, title, value, helper = '') => {
  doc.roundedRect(x, y, width, 58, 8).fillAndStroke('#f8fafc', '#e5e7eb');
  doc.fillColor('#64748b').fontSize(8).text(title, x + 10, y + 10, { width: width - 20 });
  doc.fillColor('#111827').fontSize(17).font('Helvetica-Bold').text(String(value), x + 10, y + 25, { width: width - 20 });
  if (helper) doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(helper, x + 10, y + 46, { width: width - 20 });
};

const drawBarChart = (doc, title, rows, x, y, width, height) => {
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  const chartY = y + 24;
  const max = Math.max(1, ...rows.map((row) => row.value));
  const barWidth = Math.max(18, (width - 20) / Math.max(1, rows.length) - 12);
  rows.forEach((row, index) => {
    const barHeight = Math.round((row.value / max) * (height - 50));
    const bx = x + 10 + index * (barWidth + 12);
    const by = chartY + (height - 40 - barHeight);
    doc.roundedRect(bx, by, barWidth, barHeight, 4).fill('#2563eb');
    doc.fillColor('#111827').fontSize(8).text(String(row.value), bx, by - 12, { width: barWidth, align: 'center' });
    doc.fillColor('#64748b').fontSize(7).text(row.name, bx - 8, chartY + height - 34, { width: barWidth + 16, align: 'center' });
  });
};

const drawLineChart = (doc, title, rows, x, y, width, height) => {
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  const chartY = y + 24;
  const max = Math.max(1, ...rows.map((row) => row.value));
  doc.strokeColor('#e5e7eb').moveTo(x, chartY + height - 35).lineTo(x + width, chartY + height - 35).stroke();
  rows.forEach((row, index) => {
    if (index === 0) return;
    const prev = rows[index - 1];
    const px = x + ((index - 1) / Math.max(1, rows.length - 1)) * width;
    const py = chartY + height - 35 - (prev.value / max) * (height - 48);
    const cx = x + (index / Math.max(1, rows.length - 1)) * width;
    const cy = chartY + height - 35 - (row.value / max) * (height - 48);
    doc.strokeColor('#0f766e').lineWidth(2).moveTo(px, py).lineTo(cx, cy).stroke();
  });
  rows.forEach((row, index) => {
    const cx = x + (index / Math.max(1, rows.length - 1)) * width;
    const cy = chartY + height - 35 - (row.value / max) * (height - 48);
    doc.circle(cx, cy, 2.5).fill('#0f766e');
    if (index % 2 === 0 || rows.length <= 6) doc.fillColor('#64748b').fontSize(6).text(row.name, cx - 16, chartY + height - 28, { width: 32, align: 'center' });
  });
};

const drawList = (doc, title, rows, x, y, width) => {
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(title, x, y);
  rows.forEach((row, index) => {
    const yy = y + 24 + index * 18;
    doc.circle(x + 4, yy + 4, 4).fill(row.color || '#2563eb');
    doc.fillColor('#374151').fontSize(8).font('Helvetica').text(row.name, x + 14, yy, { width: width - 55 });
    doc.fillColor('#111827').font('Helvetica-Bold').text(String(row.value), x + width - 35, yy, { width: 35, align: 'right' });
  });
};

const buildKpiPdf = (overview, filters = {}) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const statusRows = overview.ticketsByStatus || [];
  const active = ['OPEN', 'ASSIGNED', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'REOPENED'].reduce((sum, status) => sum + getCount(statusRows, status), 0);
  const completed = getCount(statusRows, 'RESOLVED') + getCount(statusRows, 'CLOSED');
  const service = overview.serviceOperations || {};
  const technicians = [...(overview.ticketsByTechnician || [])].filter((item) => item.technicianId).sort((a, b) => b.score - a.score);
  const priorityRows = (overview.ticketsByPriority || []).map((item) => ({ name: priorityLabel[item.priority] || item.priority, value: item.count || 0 }));
  const monthlyRows = (overview.monthlyVolume || []).map((item) => ({ name: item.month, value: item.count || 0 }));
  const replacementRows = (service.replacementsByStatus || []).map((item) => ({ name: replacementLabel[item.status] || item.status, value: item.count || 0 }));
  const statusList = statusRows.map((item, index) => ({ name: statusLabel[item.status] || item.status, value: item.count || 0, color: ['#dc2626', '#f59e0b', '#2563eb', '#0f766e', '#64748b'][index % 5] }));

  doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('KOLLAB KONCEPTS', 36, 30);
  doc.fillColor('#111827').fontSize(20).text('Reporte ejecutivo de salud operativa', 36, 52);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`Periodo: ${filters.dateFrom || 'Inicio'} al ${filters.dateTo || 'hoy'}  |  Generado: ${new Date().toLocaleString('es-CR')}`, 36, 78);

  writeMetric(doc, 36, 105, 120, 'Tickets activos', active);
  writeMetric(doc, 168, 105, 120, 'Completados', completed);
  writeMetric(doc, 300, 105, 120, 'SLA cumplido', pct(overview.slaCompliance?.complianceRate), `${overview.slaCompliance?.breached || 0} vencidos`);
  writeMetric(doc, 432, 105, 120, 'Calificacion', overview.ratingSummary?.average || 0, `${overview.ratingSummary?.count || 0} opiniones`);

  drawLineChart(doc, 'Volumen mensual de tickets', monthlyRows, 36, 190, 500, 145);
  drawBarChart(doc, 'Tickets por prioridad', priorityRows, 36, 365, 245, 145);
  drawList(doc, 'Casos por estado', statusList, 315, 365, 220);

  doc.addPage();
  doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold').text('Rendimiento y operacion', 36, 36);
  writeMetric(doc, 36, 70, 120, 'Reemplazos abiertos', (service.replacementsByStatus || []).filter((item) => item.status !== 'DELIVERED' && item.status !== 'REJECTED').reduce((sum, item) => sum + item.count, 0));
  writeMetric(doc, 168, 70, 120, 'Reemplazos entregados', getCount(service.replacementsByStatus, 'DELIVERED'));
  writeMetric(doc, 300, 70, 120, 'Reembolsos', service.refundCount || 0);
  writeMetric(doc, 432, 70, 120, 'Monto reembolsado', money(service.refundAmount));
  drawBarChart(doc, 'Reemplazos por estado', replacementRows, 36, 160, 500, 140);

  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Top 3 tecnicos', 36, 335);
  const top = technicians.slice(0, 3);
  top.forEach((tech, index) => {
    const y = 365 + index * 52;
    doc.roundedRect(36, y, 500, 40, 6).fillAndStroke('#f8fafc', '#e5e7eb');
    doc.fillColor('#dc2626').fontSize(14).font('Helvetica-Bold').text(`#${index + 1}`, 48, y + 12, { width: 35 });
    doc.fillColor('#111827').fontSize(10).text(tech.technicianName, 90, y + 8, { width: 180 });
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(`${tech.resolved} resueltos | ${tech.open} abiertos | ${pct(tech.resolutionRate)} resolucion | rating ${tech.ratingAverage || 0}`, 90, y + 23, { width: 360 });
  });

  doc.end();
});

const buildFile = async ({ reportType, rows, format, rawData, filters }) => {
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
      buffer: reportType === 'KPI_OVERVIEW' ? await buildKpiPdf(rawData, filters) : await exportPdf({ title, columns, rows }),
      contentType: 'application/pdf',
      extension: 'pdf'
    };
  }

  throw new BadRequestError('Formato de reporte no soportado');
};

const reportExportService = {
  async generate({ reportType, filters = {}, format = 'CSV' }, user, context = {}) {
    const rawData = reportType === 'KPI_OVERVIEW' ? await kpiService.overview(filters) : null;
    const rows = rawData ? flattenRows(rawData) : await buildReportRows({ reportType, filters });

    if (!rows.length) {
      throw new BadRequestError('No hay datos para exportar');
    }

    const file = await buildFile({ reportType, rows, format, rawData, filters });
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
