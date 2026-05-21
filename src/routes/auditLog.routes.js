const { Router } = require('express');
const { z } = require('zod');

const auditLogController = require('../controllers/auditLog.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const auditLogQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  result: z.enum(['SUCCESS', 'FAILURE']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  format: z.literal('csv').optional()
});

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/', validate(auditLogQuerySchema, 'query'), asyncHandler(auditLogController.list));
router.get('/export', validate(auditLogQuerySchema, 'query'), asyncHandler(auditLogController.exportLogs));
router.get('/:id', asyncHandler(auditLogController.getById));

module.exports = router;
