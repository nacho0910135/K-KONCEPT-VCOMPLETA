const cron = require('node-cron');

const { env } = require('../config/env');
const { scheduledReportService } = require('../services/scheduledReport.service');
const { logger } = require('../utils/logger');

const createScheduledReportsJob = () => cron.schedule(
  env.cron.scheduledReports,
  async () => {
    try {
      logger.info('Iniciando job de reportes programados');
      const result = await scheduledReportService.executeDueReports();
      logger.info({ result }, 'Job de reportes programados finalizado');
    } catch (error) {
      logger.error({ error }, 'Error en job de reportes programados');
    }
  },
  {
    scheduled: false,
    timezone: 'America/Costa_Rica'
  }
);

module.exports = { createScheduledReportsJob };
