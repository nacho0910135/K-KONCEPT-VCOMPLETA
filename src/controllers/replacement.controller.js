const { replacementService } = require('../services/replacement.service');
const { successResponse } = require('../utils/responseHelper');

const request = async (req, res) => {
  const replacement = await replacementService.request(req.params.ticketId, req.body, req.user);
  return successResponse(res, {
    statusCode: 201,
    data: { replacement },
    message: 'Solicitud de reemplazo creada correctamente'
  });
};

const validate = async (req, res) => {
  const replacement = await replacementService.validate(req.params.id, req.body, req.user);
  return successResponse(res, {
    data: { replacement },
    message: 'Reemplazo validado correctamente'
  });
};

const createNewProduct = async (req, res) => {
  const replacement = await replacementService.saveNewProduct(req.params.id, req.body, req.user);
  return successResponse(res, {
    statusCode: 201,
    data: { replacement },
    message: 'Producto de reemplazo registrado correctamente'
  });
};

const updateNewProduct = async (req, res) => {
  const replacement = await replacementService.saveNewProduct(req.params.id, req.body, req.user);
  return successResponse(res, {
    data: { replacement },
    message: 'Producto de reemplazo actualizado correctamente'
  });
};

const registerDelivery = async (req, res) => {
  const replacement = await replacementService.registerDelivery(req.params.id, req.body, req.user);
  return successResponse(res, {
    data: { replacement },
    message: 'Entrega registrada y constancia generada correctamente'
  });
};

const getById = async (req, res) => {
  const replacement = await replacementService.getById(req.params.id, req.user);
  return successResponse(res, { data: { replacement } });
};

const getByTicketId = async (req, res) => {
  const replacement = await replacementService.getByTicketId(req.params.ticketId, req.user);
  return successResponse(res, { data: { replacement } });
};

const downloadCertificate = async (req, res) => {
  const replacement = await replacementService.getCertificate(req.params.id, req.user);
  return res.redirect(302, replacement.pdfUrl);
};

const regenerateCertificate = async (req, res) => {
  const replacement = await replacementService.regenerateCertificate(req.params.id, req.user);
  return successResponse(res, {
    data: { replacement },
    message: 'Constancia regenerada correctamente'
  });
};

module.exports = {
  request,
  validate,
  createNewProduct,
  updateNewProduct,
  registerDelivery,
  getById,
  getByTicketId,
  downloadCertificate,
  regenerateCertificate
};
