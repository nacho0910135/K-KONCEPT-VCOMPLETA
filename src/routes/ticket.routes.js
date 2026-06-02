const { Router } = require('express');

const ticketController = require('../controllers/ticket.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createTicketSchema,
  ticketIdParamSchema,
  ticketPreviewSchema,
  myTicketsQuerySchema,
  assignedTicketsQuerySchema,
  adminTicketsQuerySchema,
  changeStatusSchema,
  confirmSolutionSchema,
  rejectSolutionSchema,
  assignTicketSchema,
  updatePrioritySchema,
  updateDiagnosisSchema,
  searchTicketsQuerySchema
} = require('../validators/ticket.validator');
const { createTicketCommentSchema } = require('../validators/ticketComment.validator');
const ticketCommentController = require('../controllers/ticketComment.controller');

const router = Router();

router.use(verifyToken);

router.get('/me', authorizeRoles('CLIENT'), validate(myTicketsQuerySchema, 'query'), asyncHandler(ticketController.listMine));
router.get('/assigned', authorizeRoles('TECHNICIAN'), validate(assignedTicketsQuerySchema, 'query'), asyncHandler(ticketController.listAssigned));
router.get('/preview', authorizeRoles('CLIENT'), validate(ticketPreviewSchema, 'query'), asyncHandler(ticketController.preview));
router.get('/search', authorizeRoles('TECHNICIAN', 'ADMIN'), validate(searchTicketsQuerySchema, 'query'), asyncHandler(ticketController.search));
router.get('/', authorizeRoles('ADMIN'), validate(adminTicketsQuerySchema, 'query'), asyncHandler(ticketController.listAll));

router.post('/', authorizeRoles('CLIENT'), validate(createTicketSchema), asyncHandler(ticketController.create));
router.get('/:id', authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'), validate(ticketIdParamSchema, 'params'), asyncHandler(ticketController.getById));
router.get('/:id/history', authorizeRoles('TECHNICIAN', 'ADMIN'), validate(ticketIdParamSchema, 'params'), asyncHandler(ticketController.getHistory));
router.patch('/:id/status', authorizeRoles('TECHNICIAN', 'ADMIN'), validate(ticketIdParamSchema, 'params'), validate(changeStatusSchema), asyncHandler(ticketController.changeStatus));
router.patch('/:id/diagnosis', authorizeRoles('TECHNICIAN'), validate(ticketIdParamSchema, 'params'), validate(updateDiagnosisSchema), asyncHandler(ticketController.updateDiagnosis));
router.patch('/:id/assign', authorizeRoles('ADMIN'), validate(ticketIdParamSchema, 'params'), validate(assignTicketSchema), asyncHandler(ticketController.assignTechnician));
router.patch('/:id/priority', authorizeRoles('ADMIN'), validate(ticketIdParamSchema, 'params'), validate(updatePrioritySchema), asyncHandler(ticketController.updatePriority));
router.delete('/:id', authorizeRoles('ADMIN'), validate(ticketIdParamSchema, 'params'), asyncHandler(ticketController.remove));
router.post('/:id/confirm-solution', authorizeRoles('CLIENT'), validate(ticketIdParamSchema, 'params'), validate(confirmSolutionSchema), asyncHandler(ticketController.confirmSolution));
router.post('/:id/reject-solution', authorizeRoles('CLIENT'), validate(ticketIdParamSchema, 'params'), validate(rejectSolutionSchema), asyncHandler(ticketController.rejectSolution));
router.post('/:id/comments', authorizeRoles('CLIENT', 'TECHNICIAN', 'ADMIN'), validate(ticketIdParamSchema, 'params'), validate(createTicketCommentSchema), asyncHandler(ticketCommentController.create));

module.exports = router;
