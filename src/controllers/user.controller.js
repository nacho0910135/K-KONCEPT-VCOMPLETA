const { userService } = require('../services/user.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => successResponse(res, {
  statusCode: 201,
  data: { user: await userService.create(req.body, req.user) },
  message: 'Usuario creado correctamente'
});

const list = async (req, res) => {
  const result = await userService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const getById = async (req, res) => successResponse(res, {
  data: { user: await userService.getById(req.params.id) }
});

const update = async (req, res) => successResponse(res, {
  data: { user: await userService.update(req.params.id, req.body) },
  message: 'Usuario actualizado correctamente'
});

const updateRole = async (req, res) => successResponse(res, {
  data: { user: await userService.updateRole(req.params.id, req.body.role, req.user) },
  message: 'Rol actualizado correctamente'
});

const deactivate = async (req, res) => successResponse(res, {
  data: { user: await userService.setActive(req.params.id, false) },
  message: 'Usuario desactivado correctamente'
});

const activate = async (req, res) => successResponse(res, {
  data: { user: await userService.setActive(req.params.id, true) },
  message: 'Usuario activado correctamente'
});

module.exports = { create, list, getById, update, updateRole, deactivate, activate };
