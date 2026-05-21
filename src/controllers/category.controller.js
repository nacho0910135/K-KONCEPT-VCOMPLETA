const { categoryService } = require('../services/category.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { category: await categoryService.create(req.body, req.user) },
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
  data: { category: await categoryService.update(req.params.id, req.body, req.user) },
  message: 'Categoria actualizada correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { category: await categoryService.setActive(req.params.id, false, req.user) },
  message: 'Categoria desactivada correctamente'
});

const activate = async (req, res) => successResponse(res, {
  data: { category: await categoryService.setActive(req.params.id, true, req.user) },
  message: 'Categoria activada correctamente'
});

const remove = async (req, res) => successResponse(res, {
  data: { category: await categoryService.delete(req.params.id, req.user) },
  message: 'Categoria eliminada correctamente'
});

module.exports = { create, list, getById, update, deactivate, activate, remove };
