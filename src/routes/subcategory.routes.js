const { Router } = require('express');

const subcategoryController = require('../controllers/subcategory.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { subcategoryMutationSchema } = require('../validators/subcategory.validator');

const router = Router();

router.put('/:id', verifyToken, authorizeRoles('ADMIN'), validate(subcategoryMutationSchema), asyncHandler(subcategoryController.update));
router.patch('/:id/deactivate', verifyToken, authorizeRoles('ADMIN'), asyncHandler(subcategoryController.deactivate));
router.patch('/:id/activate', verifyToken, authorizeRoles('ADMIN'), asyncHandler(subcategoryController.activate));
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), asyncHandler(subcategoryController.remove));

module.exports = router;
