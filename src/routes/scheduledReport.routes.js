const { Router } = require('express');

const scheduledReportController = require('../controllers/scheduledReport.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  scheduledReportSchema,
  scheduledReportUpdateSchema,
  scheduledReportQuerySchema
} = require('../validators/report.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.post('/', validate(scheduledReportSchema), asyncHandler(scheduledReportController.create));
router.get('/', validate(scheduledReportQuerySchema, 'query'), asyncHandler(scheduledReportController.list));
router.put('/:id', validate(scheduledReportUpdateSchema), asyncHandler(scheduledReportController.update));
router.patch('/:id/toggle', asyncHandler(scheduledReportController.toggle));
router.delete('/:id', asyncHandler(scheduledReportController.remove));

module.exports = router;
