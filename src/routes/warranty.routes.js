const { Router } = require('express');

const warrantyController = require('../controllers/warranty.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  warrantyMutationSchema,
  warrantyUpdateSchema,
  warrantyQuerySchema,
  warrantyValidateQuerySchema
} = require('../validators/warranty.validator');

const router = Router();

router.use(verifyToken);

router.get('/me', authorizeRoles('CLIENT'), asyncHandler(warrantyController.listMine));
router.get('/validate', authorizeRoles('CLIENT'), validate(warrantyValidateQuerySchema, 'query'), asyncHandler(warrantyController.validate));

router.post('/', authorizeRoles('ADMIN'), validate(warrantyMutationSchema), asyncHandler(warrantyController.create));
router.get('/', authorizeRoles('ADMIN'), validate(warrantyQuerySchema, 'query'), asyncHandler(warrantyController.list));
router.put('/:id', authorizeRoles('ADMIN'), validate(warrantyUpdateSchema), asyncHandler(warrantyController.update));
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(warrantyController.remove));

module.exports = router;
