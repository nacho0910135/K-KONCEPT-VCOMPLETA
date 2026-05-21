const { Router } = require('express');

const ticketCommentController = require('../controllers/ticketComment.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const { createTicketCommentSchema } = require('../validators/ticketComment.validator');

const router = Router({ mergeParams: true });

router.post('/', verifyToken, authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'), validate(createTicketCommentSchema), asyncHandler(ticketCommentController.create));

module.exports = router;
