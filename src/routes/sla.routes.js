const { Router } = require('express');

const slaController = require('../controllers/sla.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createSlaSchema,
  updateSlaSchema,
  slaQuerySchema
} = require('../validators/sla.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/', validate(slaQuerySchema, 'query'), asyncHandler(slaController.list));
router.post('/', validate(createSlaSchema), asyncHandler(slaController.create));
router.get('/:id/history', asyncHandler(slaController.history));
router.put('/:id', validate(updateSlaSchema), asyncHandler(slaController.update));
router.delete('/:id', asyncHandler(slaController.remove));

module.exports = router;
