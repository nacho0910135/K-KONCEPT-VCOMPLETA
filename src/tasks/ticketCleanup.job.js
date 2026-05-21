const cron = require('node-cron');

const { env } = require('../config/env');
const { ticketCleanupService } = require('../services/ticketCleanup.service');
const { logger } = require('../utils/logger');

const createTicketCleanupJob = () => cron.schedule(
  env.cron.ticketCleanup,
  async () => {
    try {
      logger.info('Iniciando job de cierre automatico de tickets RESOLVED');
      const result = await ticketCleanupService.closeInactiveResolvedTickets();
      logger.info({ result }, 'Job de cierre automatico finalizado');
    } catch (error) {
      logger.error({ error }, 'Error en job de cierre automatico');
    }
  },
  {
    scheduled: false,
    timezone: 'America/Costa_Rica'
  }
);

module.exports = { createTicketCleanupJob };
