const { Router } = require('express');

const notificationConfigController = require('../controllers/notificationConfig.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { channelUpdateSchema } = require('../validators/notification.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.get('/', asyncHandler(notificationConfigController.listChannels));
router.patch('/:channel', validate(channelUpdateSchema), asyncHandler(notificationConfigController.updateChannel));

module.exports = router;
