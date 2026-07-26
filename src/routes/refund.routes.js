const { Router } = require('express');

const refundController = require('../controllers/refund.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.get('/refunds', verifyToken, authorizeRoles('TECHNICIAN', 'ADMIN'), asyncHandler(refundController.list));
router.get('/refunds/export/:format(csv|xls)', verifyToken, authorizeRoles('TECHNICIAN', 'ADMIN'), asyncHandler(refundController.exportFile));
router.get('/refunds/export/pdf', verifyToken, authorizeRoles('TECHNICIAN', 'ADMIN'), asyncHandler(refundController.exportPdf));
router.get('/refunds/:id/certificate/download', verifyToken, authorizeRoles('TECHNICIAN', 'ADMIN'), asyncHandler(refundController.downloadCertificate));

module.exports = router;
