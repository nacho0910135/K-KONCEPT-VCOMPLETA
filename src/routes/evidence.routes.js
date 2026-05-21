const { Router } = require('express');

const evidenceController = require('../controllers/evidence.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { uploadEvidenceFiles, validateEvidenceFiles } = require('../middlewares/upload.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.use(verifyToken);

router.post(
  '/tickets/:ticketId/evidence',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  uploadEvidenceFiles,
  validateEvidenceFiles,
  asyncHandler(evidenceController.upload)
);

router.get(
  '/tickets/:ticketId/evidence',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(evidenceController.list)
);

router.get(
  '/evidence/:id/download',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(evidenceController.download)
);

router.delete(
  '/evidence/:id',
  authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'),
  asyncHandler(evidenceController.remove)
);

module.exports = router;
