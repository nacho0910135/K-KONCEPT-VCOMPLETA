const { Router } = require('express');

const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { notificationQuerySchema } = require('../validators/notification.validator');

const router = Router();

router.use(verifyToken);

router.get('/me', validate(notificationQuerySchema, 'query'), asyncHandler(notificationController.listMine));
router.get('/me/unread-count', asyncHandler(notificationController.unreadCount));
router.patch('/me/read-all', asyncHandler(notificationController.markAllRead));
router.patch('/:id/read', asyncHandler(notificationController.markRead));

module.exports = router;
