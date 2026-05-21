const { warrantyService } = require('../services/warranty.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { warranty: await warrantyService.create(req.body) },
  message: 'Garantia creada correctamente'
});

const list = async (req, res) => {
  const result = await warrantyService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const listMine = async (req, res) => successResponse(res, {
  data: await warrantyService.listMine(req.user)
});

const validate = async (req, res) => successResponse(res, {
  data: await warrantyService.validateForClient(req.query, req.user)
});

const update = async (req, res) => successResponse(res, {
  data: { warranty: await warrantyService.update(req.params.id, req.body) },
  message: 'Garantia actualizada correctamente'
});

const remove = async (req, res) => successResponse(res, {
  data: { warranty: await warrantyService.delete(req.params.id) },
  message: 'Garantia anulada correctamente'
});

module.exports = { create, list, listMine, validate, update, remove };
