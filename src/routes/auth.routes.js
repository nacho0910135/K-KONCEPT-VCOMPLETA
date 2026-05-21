const { Router } = require('express');

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema
} = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', verifyToken, validate(logoutSchema), asyncHandler(authController.logout));
router.get('/me', verifyToken, asyncHandler(authController.me));

module.exports = router;
