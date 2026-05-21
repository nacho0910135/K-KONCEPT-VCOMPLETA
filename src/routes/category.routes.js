const { Router } = require('express');

const categoryController = require('../controllers/category.controller');
const subcategoryController = require('../controllers/subcategory.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { categoryMutationSchema, categoryQuerySchema } = require('../validators/category.validator');
const { subcategoryMutationSchema } = require('../validators/subcategory.validator');

const router = Router();

router.get('/', verifyToken, authorizeRoles('ADMIN'), validate(categoryQuerySchema, 'query'), asyncHandler(categoryController.list));
router.get('/:id', verifyToken, authorizeRoles('ADMIN'), asyncHandler(categoryController.getById));
router.get('/:categoryId/subcategories', verifyToken, asyncHandler(subcategoryController.listByCategory));

router.post('/', verifyToken, authorizeRoles('ADMIN'), validate(categoryMutationSchema), asyncHandler(categoryController.create));
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), validate(categoryMutationSchema), asyncHandler(categoryController.update));
router.patch('/:id/deactivate', verifyToken, authorizeRoles('ADMIN'), asyncHandler(categoryController.deactivate));
router.patch('/:id/activate', verifyToken, authorizeRoles('ADMIN'), asyncHandler(categoryController.activate));
router.post('/:categoryId/subcategories', verifyToken, authorizeRoles('ADMIN'), validate(subcategoryMutationSchema), asyncHandler(subcategoryController.create));

module.exports = router;
