const { Router } = require('express');

const appointmentController = require('../controllers/appointment.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  availabilityQuerySchema
} = require('../validators/appointment.validator');

const router = Router();

router.use(verifyToken);

router.post(
  '/tickets/:ticketId/appointments',
  authorizeRoles('ADMIN', 'TECHNICIAN'),
  validate(createAppointmentSchema),
  asyncHandler(appointmentController.create)
);

router.post(
  '/tickets/:ticketId/appointments/reschedule',
  authorizeRoles('CLIENT'),
  validate(rescheduleAppointmentSchema),
  asyncHandler(appointmentController.reschedule)
);

router.get(
  '/appointments/availability',
  authorizeRoles('ADMIN', 'TECHNICIAN', 'CLIENT'),
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(appointmentController.availability)
);

router.patch(
  '/appointments/:id/complete',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  asyncHandler(appointmentController.complete)
);

router.patch(
  '/appointments/:id/cancel',
  authorizeRoles('TECHNICIAN', 'ADMIN'),
  asyncHandler(appointmentController.cancel)
);

module.exports = router;
