const { healthRepository } = require('../repositories/health.repository');

const healthService = {
  async getHealthStatus() {
    const database = await healthRepository.checkConnection();

    return {
      service: 'kollab-koncepts-reportes-backend',
      status: database.connected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database
    };
  }
};

module.exports = { healthService };
