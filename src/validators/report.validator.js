const { z } = require('zod');

const reportTypeSchema = z.enum(['TICKETS', 'KPI_OVERVIEW', 'AUDIT', 'SLA']);
const reportFormatSchema = z.enum(['CSV', 'EXCEL', 'PDF']);
const frequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);

const validDateRange = (data) => !data.dateFrom || !data.dateTo || new Date(data.dateFrom) <= new Date(data.dateTo);
const dateRangeError = { message: 'Desde no puede ser posterior a Hasta', path: ['dateTo'] };
const reportDateSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Fecha invalida');
const reportFiltersSchema = z.object({
  dateFrom: reportDateSchema.optional(),
  dateTo: reportDateSchema.optional()
}).passthrough().refine(validDateRange, dateRangeError);

const kpiFilterSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  categoryId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional()
}).refine(validDateRange, dateRangeError);

const reportExportSchema = z.object({
  reportType: reportTypeSchema,
  filters: reportFiltersSchema.optional().default({}),
  format: reportFormatSchema.default('CSV')
});

const scheduledReportSchema = z.object({
  name: z.string().trim().min(2),
  reportType: reportTypeSchema,
  parameters: reportFiltersSchema.optional().default({}),
  frequency: frequencySchema.optional(),
  recipients: z.array(z.string().email()).optional(),
  format: reportFormatSchema
}).refine(
  (data) => Boolean(data.frequency && Array.isArray(data.recipients) && data.recipients.length > 0),
  {
    message: 'Programacion incompleta: recipients y frequency son obligatorios',
    path: ['recipients']
  }
);

const scheduledReportUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  reportType: reportTypeSchema.optional(),
  parameters: reportFiltersSchema.optional(),
  frequency: frequencySchema.optional(),
  recipients: z.array(z.string().email()).min(1, 'Programacion incompleta: recipients y frequency son obligatorios').optional(),
  format: reportFormatSchema.optional()
});

const scheduledReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  active: z.coerce.boolean().optional(),
  reportType: reportTypeSchema.optional()
});

module.exports = {
  kpiFilterSchema,
  reportExportSchema,
  scheduledReportSchema,
  scheduledReportUpdateSchema,
  scheduledReportQuerySchema
};
