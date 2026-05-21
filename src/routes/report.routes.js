const { Router } = require('express');

const reportController = require('../controllers/report.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { kpiFilterSchema, reportExportSchema } = require('../validators/report.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/kpi/overview', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.overview));
router.get('/kpi/tickets-by-status', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.ticketsByStatus));
router.get('/kpi/tickets-by-priority', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.ticketsByPriority));
router.get('/kpi/tickets-by-category', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.ticketsByCategory));
router.get('/kpi/tickets-by-technician', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.ticketsByTechnician));
router.get('/kpi/sla-compliance', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.slaCompliance));
router.get('/kpi/avg-resolution-time', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.avgResolutionTime));
router.get('/kpi/ratings-distribution', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.ratingsDistribution));
router.get('/kpi/monthly-volume', validate(kpiFilterSchema, 'query'), asyncHandler(reportController.monthlyVolume));

router.post('/export', validate(reportExportSchema), asyncHandler(reportController.exportReport));

module.exports = router;
