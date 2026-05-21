const { subcategoryService } = require('../services/subcategory.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { subcategory: await subcategoryService.create(req.params.categoryId, req.body, req.user) },
  message: 'Subcategoria creada correctamente'
});

const listByCategory = async (req, res) => successResponse(res, {
  data: await subcategoryService.listByCategory(req.params.categoryId)
});

const update = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.update(req.params.id, req.body, req.user) },
  message: 'Subcategoria actualizada correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.deactivate(req.params.id, req.user) },
  message: 'Subcategoria desactivada correctamente'
});

const activate = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.activate(req.params.id, req.user) },
  message: 'Subcategoria activada correctamente'
});

const remove = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.delete(req.params.id, req.user) },
  message: 'Subcategoria eliminada correctamente'
});

module.exports = { create, listByCategory, update, deactivate, activate, remove };
