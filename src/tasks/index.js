const { env } = require('../config/env');
const { logger } = require('../utils/logger');
const { createScheduledReportsJob } = require('./scheduledReports.job');
const { createSlaCheckJob } = require('./slaCheck.job');
const { createTicketCleanupJob } = require('./ticketCleanup.job');

const jobs = [];

const startCronJobs = () => {
  if (!env.cron.enabled) {
    logger.info('Cron jobs deshabilitados por configuracion');
    return;
  }

  if (jobs.length > 0) return;

  jobs.push(createTicketCleanupJob());
  jobs.push(createSlaCheckJob());
  jobs.push(createScheduledReportsJob());

  jobs.forEach((job) => job.start());
  logger.info({ count: jobs.length }, 'Cron jobs iniciados');
};

const stopCronJobs = () => {
  jobs.forEach((job) => job.stop());
  jobs.length = 0;
  logger.info('Cron jobs detenidos');
};

module.exports = { startCronJobs, stopCronJobs };
