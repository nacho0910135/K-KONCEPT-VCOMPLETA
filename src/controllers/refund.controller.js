const { refundService } = require('../services/refund.service');
const { successResponse } = require('../utils/responseHelper');

const list = async (req, res) => successResponse(res, {
  data: { refunds: await refundService.list(req.user) }
});

const exportPdf = async (req, res) => {
  const pdf = await refundService.exportListPdf(req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
  return res.send(pdf.buffer);
};

module.exports = { list, exportPdf };
