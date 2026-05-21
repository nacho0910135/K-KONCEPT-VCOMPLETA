const { scheduledReportService } = require('../services/scheduledReport.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { scheduledReport: await scheduledReportService.create(req.body, req.user) },
  message: 'Reporte programado creado correctamente'
});

const list = async (req, res) => {
  const result = await scheduledReportService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const update = async (req, res) => successResponse(res, {
  data: { scheduledReport: await scheduledReportService.update(req.params.id, req.body, req.user) },
  message: 'Reporte programado actualizado correctamente'
});

const toggle = async (req, res) => successResponse(res, {
  data: { scheduledReport: await scheduledReportService.toggle(req.params.id, req.user) },
  message: 'Reporte programado alternado correctamente'
});

const remove = async (req, res) => successResponse(res, {
  data: { scheduledReport: await scheduledReportService.remove(req.params.id, req.user) },
  message: 'Reporte programado eliminado correctamente'
});

module.exports = { create, list, update, toggle, remove };
