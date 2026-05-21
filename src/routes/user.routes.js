const { Router } = require('express');

const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  userQuerySchema
} = require('../validators/user.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.post('/', validate(createUserSchema), asyncHandler(userController.create));
router.get('/', validate(userQuerySchema, 'query'), asyncHandler(userController.list));
router.get('/:id', asyncHandler(userController.getById));
router.put('/:id', validate(updateUserSchema), asyncHandler(userController.update));
router.patch('/:id/role', validate(updateUserRoleSchema), asyncHandler(userController.updateRole));
router.patch('/:id/deactivate', asyncHandler(userController.deactivate));
router.patch('/:id/activate', asyncHandler(userController.activate));

module.exports = router;
