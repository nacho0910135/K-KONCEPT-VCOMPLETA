const { auditLogRepository } = require('../repositories/auditLog.repository');

const auditService = {
  record(entry) {
    return auditLogRepository.create({
      result: 'SUCCESS',
      ...entry
    });
  },

  recordFailure(entry) {
    return auditLogRepository.create({
      result: 'FAILURE',
      ...entry
    });
  }
};

module.exports = { auditService };
