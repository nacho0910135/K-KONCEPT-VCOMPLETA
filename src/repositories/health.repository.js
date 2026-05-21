const { prisma } = require('../config/database');

const healthRepository = {
  async checkConnection() {
    const startedAt = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        connected: true,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        connected: false,
        latencyMs: Date.now() - startedAt,
        error: error.message
      };
    }
  }
};

module.exports = { healthRepository };
