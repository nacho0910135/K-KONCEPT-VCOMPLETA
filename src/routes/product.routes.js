const { Router } = require('express');

const productController = require('../controllers/product.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { productMutationSchema, productQuerySchema } = require('../validators/product.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.post('/', validate(productMutationSchema), asyncHandler(productController.create));
router.get('/', validate(productQuerySchema, 'query'), asyncHandler(productController.list));
router.get('/:id', asyncHandler(productController.getById));
router.put('/:id', validate(productMutationSchema), asyncHandler(productController.update));
router.patch('/:id/deactivate', asyncHandler(productController.deactivate));

module.exports = router;
