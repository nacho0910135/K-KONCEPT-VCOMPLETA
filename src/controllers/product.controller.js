const { productService } = require('../services/product.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { product: await productService.create(req.body) },
  message: 'Producto creado correctamente'
});

const list = async (req, res) => {
  const result = await productService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const getById = async (req, res) => successResponse(res, {
  data: { product: await productService.getById(req.params.id) }
});

const update = async (req, res) => successResponse(res, {
  data: { product: await productService.update(req.params.id, req.body) },
  message: 'Producto actualizado correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { product: await productService.deactivate(req.params.id) },
  message: 'Producto desactivado correctamente'
});

module.exports = { create, list, getById, update, deactivate };
