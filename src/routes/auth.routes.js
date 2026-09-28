const { Router } = require('express');

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  challengeSchema,
  verifyLoginSchema,
  beginTotpSchema,
  confirmTotpSchema,
  confirmRegistrationTotpSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  refreshSchema,
  logoutSchema
} = require('../validators/auth.validator');

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/login/email-code', validate(challengeSchema), asyncHandler(authController.sendLoginCode));
router.post('/login/verify', validate(verifyLoginSchema), asyncHandler(authController.verifyLogin));
router.post('/register/authenticator', validate(confirmRegistrationTotpSchema), asyncHandler(authController.confirmRegistrationTotp));
router.get('/authenticator', verifyToken, asyncHandler(authController.totpStatus));
router.post('/authenticator/setup', verifyToken, validate(beginTotpSchema), asyncHandler(authController.beginTotpSetup));
router.post('/authenticator/confirm', verifyToken, validate(confirmTotpSchema), asyncHandler(authController.confirmTotpSetup));
router.post('/forgot-password/request', validate(passwordResetRequestSchema), asyncHandler(authController.requestPasswordReset));
router.post('/forgot-password/reset', validate(passwordResetSchema), asyncHandler(authController.resetPassword));
router.patch('/password', verifyToken, validate(changePasswordSchema), asyncHandler(authController.changePassword));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', verifyToken, validate(logoutSchema), asyncHandler(authController.logout));
router.get('/me', verifyToken, asyncHandler(authController.me));

module.exports = router;
