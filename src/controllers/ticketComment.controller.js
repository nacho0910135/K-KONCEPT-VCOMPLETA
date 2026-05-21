const { ticketCommentService } = require('../services/ticketComment.service');
const { successResponse } = require('../utils/responseHelper');

const create = async (req, res) => {
  const comment = await ticketCommentService.create(req.params.id, req.body, req.user);
  return successResponse(res, { statusCode: 201, data: { comment }, message: 'Comentario agregado correctamente' });
};

module.exports = { create };
