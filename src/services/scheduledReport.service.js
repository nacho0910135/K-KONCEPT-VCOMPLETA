const { scheduledReportRepository } = require('../repositories/scheduledReport.repository');
const { auditService } = require('./audit.service');
const { reportExportService } = require('./reportExport.service');
const { emailProvider } = require('./providers/email.provider');
const { calculateCronExpression, calculateNextRunAt } = require('../utils/cronCalculator.util');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const assertCompleteSchedule = (payload) => {
  if (!payload.frequency || !Array.isArray(payload.recipients) || payload.recipients.length === 0) {
    throw new BadRequestError('Programacion incompleta: recipients y frequency son obligatorios');
  }
};

const ensureScheduledReport = async (id) => {
  const report = await scheduledReportRepository.findById(id);
  if (!report) throw new NotFoundError('Reporte programado no encontrado');
  return report;
};

const scheduledReportService = {
  async create(payload, user) {
    assertCompleteSchedule(payload);

    const report = await scheduledReportRepository.create({
      name: payload.name,
      reportType: payload.reportType,
      parameters: payload.parameters || {},
      frequency: payload.frequency,
      cronExpression: calculateCronExpression(payload.frequency),
      recipients: payload.recipients,
      format: payload.format,
      active: true,
      nextRunAt: calculateNextRunAt(payload.frequency),
      createdById: user.id
    });

    await auditService.logEvent({
      userId: user.id,
      action: 'SCHEDULED_REPORT_CREATED',
      entity: 'ScheduledReport',
      entityId: report.id,
      newValue: report
    });

    return report;
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.reportType ? { reportType: query.reportType } : {})
    };

    const [total, items] = await scheduledReportRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async update(id, payload, user) {
    const previous = await ensureScheduledReport(id);
    if (payload.frequency !== undefined || payload.recipients !== undefined) {
      assertCompleteSchedule({
        frequency: payload.frequency || previous.frequency,
        recipients: payload.recipients || previous.recipients
      });
    }

    const frequency = payload.frequency || previous.frequency;
    const updated = await scheduledReportRepository.update(id, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.reportType !== undefined ? { reportType: payload.reportType } : {}),
      ...(payload.parameters !== undefined ? { parameters: payload.parameters } : {}),
      ...(payload.frequency !== undefined ? {
        frequency,
        cronExpression: calculateCronExpression(frequency),
        nextRunAt: calculateNextRunAt(frequency)
      } : {}),
      ...(payload.recipients !== undefined ? { recipients: payload.recipients } : {}),
      ...(payload.format !== undefined ? { format: payload.format } : {})
    });

    await auditService.logEvent({
      userId: user.id,
      action: 'SCHEDULED_REPORT_UPDATED',
      entity: 'ScheduledReport',
      entityId: id,
      previousValue: previous,
      newValue: updated
    });

    return updated;
  },

  async toggle(id, user) {
    const previous = await ensureScheduledReport(id);
    const updated = await scheduledReportRepository.update(id, { active: !previous.active });

    await auditService.logEvent({
      userId: user.id,
      action: updated.active ? 'SCHEDULED_REPORT_ACTIVATED' : 'SCHEDULED_REPORT_DEACTIVATED',
      entity: 'ScheduledReport',
      entityId: id,
      previousValue: { active: previous.active },
      newValue: { active: updated.active }
    });

    return updated;
  },

  async remove(id, user) {
    const previous = await ensureScheduledReport(id);
    const deleted = await scheduledReportRepository.delete(id);

    await auditService.logEvent({
      userId: user.id,
      action: 'SCHEDULED_REPORT_DELETED',
      entity: 'ScheduledReport',
      entityId: id,
      previousValue: previous
    });

    return deleted;
  },

  async executeDueReports() {
    const now = new Date();
    const reports = await scheduledReportRepository.findDueReports(now);
    const results = [];

    for (const report of reports) {
      try {
        await scheduledReportRepository.markRunning(report.id);
        const generated = await reportExportService.generate({
          reportType: report.reportType,
          filters: report.parameters,
          format: report.format
        }, { id: report.createdById });

        await Promise.all(report.recipients.map((email) => emailProvider.sendNotification(
          { email },
          `Reporte programado: ${report.name}`,
          `Adjunto reporte ${report.name} generado automaticamente.`,
          {
            attachments: [{
              filename: generated.filename,
              content: generated.buffer,
              contentType: generated.contentType
            }]
          }
        )));

        const lastRunAt = new Date();
        const nextRunAt = calculateNextRunAt(report.frequency, lastRunAt);
        await scheduledReportRepository.markCompleted(report.id, { lastRunAt, nextRunAt });

        await auditService.logEvent({
          userId: report.createdById,
          action: 'REPORT_GENERATED',
          entity: 'ScheduledReport',
          entityId: report.id,
          details: {
            reportType: report.reportType,
            format: report.format,
            recipients: report.recipients,
            rowCount: generated.rows.length
          }
        });

        results.push({ id: report.id, status: 'SUCCESS' });
      } catch (error) {
        logger.error({ error, reportId: report.id }, 'Error ejecutando reporte programado');
        const lastRunAt = new Date();
        await scheduledReportRepository.markCompleted(report.id, {
          lastRunAt,
          nextRunAt: calculateNextRunAt(report.frequency, lastRunAt)
        });

        await auditService.logEvent({
          userId: report.createdById,
          action: 'REPORT_GENERATED',
          entity: 'ScheduledReport',
          entityId: report.id,
          result: 'FAILURE',
          details: {
            message: error.message,
            reportType: report.reportType
          }
        });
        results.push({ id: report.id, status: 'FAILURE', error: error.message });
      }
    }

    return {
      checkedAt: now,
      processed: reports.length,
      results
    };
  }
};

module.exports = { scheduledReportService };
