const { ticketService } = require('../services/ticket.service');
const { successResponse } = require('../utils/responseHelper');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const create = async (req, res) => {
  const ticket = await ticketService.create(req.body, req.user);
  return successResponse(res, { statusCode: 201, data: { ticket }, message: 'Ticket creado correctamente' });
};

const preview = async (req, res) => {
  const previewData = await ticketService.preview(req.body, req.user);
  return successResponse(res, { data: previewData });
};

const listMine = async (req, res) => {
  const result = await ticketService.listMine(req.query, req.user);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const listAssigned = async (req, res) => {
  const result = await ticketService.listAssigned(req.query, req.user);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const listAll = async (req, res) => {
  const result = await ticketService.listAll(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const getById = async (req, res) => {
  const ticket = await ticketService.getById(req.params.id, req.user, getContext(req));
  return successResponse(res, { data: { ticket } });
};

const changeStatus = async (req, res) => {
  const ticket = await ticketService.changeStatus(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Estado actualizado correctamente' });
};

const confirmSolution = async (req, res) => {
  const ticket = await ticketService.confirmSolution(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Solucion confirmada correctamente' });
};

const rejectSolution = async (req, res) => {
  const ticket = await ticketService.rejectSolution(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Solucion rechazada correctamente' });
};

const updateDiagnosis = async (req, res) => {
  const ticket = await ticketService.updateDiagnosis(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Diagnostico actualizado correctamente' });
};

const assignTechnician = async (req, res) => {
  const ticket = await ticketService.assignTechnician(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Tecnico asignado correctamente' });
};

const updatePriority = async (req, res) => {
  const ticket = await ticketService.updatePriority(req.params.id, req.body, req.user);
  return successResponse(res, { data: { ticket }, message: 'Prioridad actualizada correctamente' });
};

const remove = async (req, res) => {
  const ticket = await ticketService.delete(req.params.id, req.user);
  return successResponse(res, { data: { ticket }, message: 'Ticket eliminado correctamente' });
};

const getHistory = async (req, res) => {
  const history = await ticketService.getHistory(req.params.id, req.user, getContext(req));
  return successResponse(res, { data: history });
};

const search = async (req, res) => {
  const result = await ticketService.search(req.query, req.user);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

module.exports = {
  create,
  preview,
  listMine,
  listAssigned,
  listAll,
  getById,
  changeStatus,
  confirmSolution,
  rejectSolution,
  updateDiagnosis,
  assignTechnician,
  updatePriority,
  remove,
  getHistory,
  search
};
