const cron = require('node-cron');

const { env } = require('../config/env');
const { slaService } = require('../services/sla.service');
const { logger } = require('../utils/logger');

const createSlaCheckJob = () => cron.schedule(
  env.cron.slaCheck,
  async () => {
    try {
      logger.info('Iniciando job de verificacion SLA');
      const result = await slaService.checkBreaches();
      logger.info({ result }, 'Job de verificacion SLA finalizado');
    } catch (error) {
      logger.error({ error }, 'Error en job de verificacion SLA');
    }
  },
  {
    scheduled: false,
    timezone: 'America/Costa_Rica'
  }
);

module.exports = { createSlaCheckJob };
