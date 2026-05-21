const { subcategoryService } = require('../services/subcategory.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { subcategory: await subcategoryService.create(req.params.categoryId, req.body) },
  message: 'Subcategoria creada correctamente'
});

const listByCategory = async (req, res) => successResponse(res, {
  data: await subcategoryService.listByCategory(req.params.categoryId)
});

const update = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.update(req.params.id, req.body) },
  message: 'Subcategoria actualizada correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { subcategory: await subcategoryService.deactivate(req.params.id) },
  message: 'Subcategoria desactivada correctamente'
});

module.exports = { create, listByCategory, update, deactivate };
