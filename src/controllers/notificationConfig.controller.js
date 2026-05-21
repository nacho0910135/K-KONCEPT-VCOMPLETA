const { notificationConfigService } = require('../services/notificationConfig.service');
const { successResponse } = require('../utils/responseHelper');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const createTemplate = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { template: await notificationConfigService.createTemplate(req.body, req.user, getContext(req)) },
  message: 'Plantilla de notificacion creada correctamente'
});

const listTemplates = async (req, res) => successResponse(res, {
  data: { templates: await notificationConfigService.listTemplates(req.query) }
});

const updateTemplate = async (req, res) => successResponse(res, {
  data: { template: await notificationConfigService.updateTemplate(req.params.id, req.body, req.user, getContext(req)) },
  message: 'Plantilla de notificacion actualizada correctamente'
});

const toggleTemplate = async (req, res) => successResponse(res, {
  data: { template: await notificationConfigService.toggleTemplate(req.params.id, req.user, getContext(req)) },
  message: 'Plantilla de notificacion alternada correctamente'
});

const listChannels = async (_req, res) => successResponse(res, {
  data: { channels: await notificationConfigService.listChannels() }
});

const updateChannel = async (req, res) => successResponse(res, {
  data: {
    channel: await notificationConfigService.updateChannel(
      req.params.channel.toUpperCase(),
      req.body,
      req.user,
      getContext(req)
    )
  },
  message: 'Canal de notificacion actualizado correctamente'
});

const createFrequencyRule = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { rule: await notificationConfigService.createFrequencyRule(req.body, req.user, getContext(req)) },
  message: 'Regla de frecuencia creada correctamente'
});

const listFrequencyRules = async (_req, res) => successResponse(res, {
  data: { rules: await notificationConfigService.listFrequencyRules() }
});

const updateFrequencyRule = async (req, res) => successResponse(res, {
  data: { rule: await notificationConfigService.updateFrequencyRule(req.params.id, req.body, req.user, getContext(req)) },
  message: 'Regla de frecuencia actualizada correctamente'
});

const toggleFrequencyRule = async (req, res) => successResponse(res, {
  data: { rule: await notificationConfigService.toggleFrequencyRule(req.params.id, req.user, getContext(req)) },
  message: 'Regla de frecuencia alternada correctamente'
});

module.exports = {
  createTemplate,
  listTemplates,
  updateTemplate,
  toggleTemplate,
  listChannels,
  updateChannel,
  createFrequencyRule,
  listFrequencyRules,
  updateFrequencyRule,
  toggleFrequencyRule
};
