const { healthService } = require('../services/health.service');
const { successResponse } = require('../utils/responseHelper');

const getHealth = async (req, res) => {
  const health = await healthService.getHealthStatus();
  return successResponse(res, {
    data: health,
    message: 'Servicio disponible'
  });
};

module.exports = { getHealth };
