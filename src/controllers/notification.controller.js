const { notificationService } = require('../services/notification.service');
const { successResponse } = require('../utils/responseHelper');

const listMine = async (req, res) => {
  const result = await notificationService.listMine(req.query, req.user);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const markRead = async (req, res) => successResponse(res, {
  data: { result: await notificationService.markRead(req.params.id, req.user) },
  message: 'Notificacion marcada como leida'
});

const markAllRead = async (req, res) => successResponse(res, {
  data: { result: await notificationService.markAllRead(req.user) },
  message: 'Notificaciones marcadas como leidas'
});

const clearMine = async (req, res) => successResponse(res, {
  data: { result: await notificationService.clearMine(req.user) },
  message: 'Notificaciones eliminadas correctamente'
});

const unreadCount = async (req, res) => successResponse(res, {
  data: await notificationService.unreadCount(req.user)
});

module.exports = {
  listMine,
  markRead,
  markAllRead,
  clearMine,
  unreadCount
};
