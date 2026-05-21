const { authService } = require('../services/auth.service');
const { successResponse } = require('../utils/responseHelper');

const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const register = async (req, res) => {
  const user = await authService.registerClient(req.body);

  return successResponse(res, {
    statusCode: 201,
    data: { user },
    message: 'Usuario registrado correctamente'
  });
};

const login = async (req, res) => {
  const result = await authService.login(req.body, getRequestContext(req));

  return successResponse(res, {
    data: result,
    message: 'Inicio de sesion correcto'
  });
};

const refresh = async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);

  return successResponse(res, {
    data: result,
    message: 'Tokens renovados correctamente'
  });
};

const logout = async (req, res) => {
  const result = await authService.logout({
    userId: req.user.id,
    refreshToken: req.body.refreshToken
  });

  return successResponse(res, {
    data: result,
    message: 'Sesion cerrada correctamente'
  });
};

const me = async (req, res) => {
  const user = await authService.me(req.user.id);

  return successResponse(res, {
    data: { user }
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
