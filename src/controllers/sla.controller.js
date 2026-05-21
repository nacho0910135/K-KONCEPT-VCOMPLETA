const { slaService } = require('../services/sla.service');
const { successResponse } = require('../utils/responseHelper');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { sla: await slaService.create(req.body, req.user, getContext(req)) },
  message: 'SLA creado correctamente'
});

const list = async (req, res) => {
  const result = await slaService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const update = async (req, res) => successResponse(res, {
  data: { sla: await slaService.update(req.params.id, req.body, req.user, getContext(req)) },
  message: 'SLA versionado correctamente'
});

const history = async (req, res) => successResponse(res, {
  data: { history: await slaService.history(req.params.id) }
});

const remove = async (req, res) => successResponse(res, {
  data: { sla: await slaService.remove(req.params.id, req.user, getContext(req)) },
  message: 'SLA desactivado correctamente'
});

module.exports = {
  create,
  list,
  update,
  history,
  remove
};
