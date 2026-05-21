require('dotenv').config();

const app = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./config/database');
const { logger } = require('./utils/logger');
const { startCronJobs, stopCronJobs } = require('./tasks');

const server = app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'Servidor HTTP iniciado');
  startCronJobs();
});

const shutdown = async (signal) => {
  logger.info({ signal }, 'Apagando servidor');
  stopCronJobs();

  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Servidor apagado correctamente');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});
