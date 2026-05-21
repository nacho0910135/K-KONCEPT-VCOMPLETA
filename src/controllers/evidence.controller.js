const { evidenceService } = require('../services/evidence.service');
const { successResponse } = require('../utils/responseHelper');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const upload = async (req, res) => {
  const evidence = await evidenceService.upload(req.params.ticketId, req.files, req.user, getContext(req));
  return successResponse(res, {
    statusCode: 201,
    data: { evidence },
    message: 'Evidencia cargada correctamente'
  });
};

const list = async (req, res) => {
  const evidence = await evidenceService.list(req.params.ticketId, req.user, getContext(req));
  return successResponse(res, { data: { evidence } });
};

const download = async (req, res) => {
  const evidence = await evidenceService.getForDownload(req.params.id, req.user, getContext(req));
  return res.redirect(302, evidence.fileUrl);
};

const remove = async (req, res) => {
  const evidence = await evidenceService.delete(req.params.id, req.user, getContext(req));
  return successResponse(res, {
    data: { evidence },
    message: 'Evidencia eliminada correctamente'
  });
};

module.exports = { upload, list, download, remove };
