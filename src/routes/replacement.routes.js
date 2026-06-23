const { Router } = require('express');

const replacementController = require('../controllers/replacement.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  requestReplacementSchema,
  validateReplacementSchema,
  newProductSchema,
  deliverySchema
} = require('../validators/replacement.validator');

const router = Router();

router.use(verifyToken);

router.post(
  '/tickets/:ticketId/replacements',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  validate(requestReplacementSchema),
  asyncHandler(replacementController.request)
);

router.get(
  '/tickets/:ticketId/replacement',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(replacementController.getByTicketId)
);

router.get(
  '/replacements',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  asyncHandler(replacementController.list)
);

router.get(
  '/replacements/export/pdf',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  asyncHandler(replacementController.exportPdf)
);

router.get(
  '/replacements/:id',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(replacementController.getById)
);

router.patch(
  '/replacements/:id/validate',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  validate(validateReplacementSchema),
  asyncHandler(replacementController.validate)
);

router.post(
  '/replacements/:id/new-product',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  validate(newProductSchema),
  asyncHandler(replacementController.createNewProduct)
);

router.put(
  '/replacements/:id/new-product',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  validate(newProductSchema),
  asyncHandler(replacementController.updateNewProduct)
);

router.post(
  '/replacements/:id/delivery',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  validate(deliverySchema),
  asyncHandler(replacementController.registerDelivery)
);

router.get(
  '/replacements/:id/certificate/download',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(replacementController.downloadCertificate)
);

router.post(
  '/replacements/:id/certificate/regenerate',
  authorizeRoles('ADMIN'),
  asyncHandler(replacementController.regenerateCertificate)
);

module.exports = router;
