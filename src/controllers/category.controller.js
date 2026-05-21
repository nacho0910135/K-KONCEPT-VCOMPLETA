const { categoryService } = require('../services/category.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { category: await categoryService.create(req.body) },
  message: 'Categoria creada correctamente'
});

const list = async (req, res) => {
  const result = await categoryService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const getById = async (req, res) => successResponse(res, {
  data: { category: await categoryService.getById(req.params.id) }
});

const update = async (req, res) => successResponse(res, {
  data: { category: await categoryService.update(req.params.id, req.body) },
  message: 'Categoria actualizada correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { category: await categoryService.setActive(req.params.id, false) },
  message: 'Categoria desactivada correctamente'
});

const activate = async (req, res) => successResponse(res, {
  data: { category: await categoryService.setActive(req.params.id, true) },
  message: 'Categoria activada correctamente'
});

module.exports = { create, list, getById, update, deactivate, activate };
