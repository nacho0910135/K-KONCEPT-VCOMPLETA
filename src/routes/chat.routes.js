const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { sendMessageSchema } = require('../validators/chat.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN', 'TECHNICIAN'));
router.get('/users', asyncHandler(chatController.users));
router.get('/unread', asyncHandler(chatController.unread));
router.get('/messages/:peerId', asyncHandler(chatController.messages));
router.post('/messages', validate(sendMessageSchema), asyncHandler(chatController.send));

module.exports = router;
