const { z } = require('zod');

const createAppointmentSchema = z.object({
  technicianId: z.string().uuid(),
  appointmentDate: z.coerce.date(),
  reason: z.string().trim().min(1)
});

const rescheduleAppointmentSchema = z.object({
  newDate: z.coerce.date(),
  reason: z.string().trim().min(1)
});

const availabilityQuerySchema = z.object({
  date: z.coerce.date(),
  technicianId: z.string().uuid()
});

module.exports = {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  availabilityQuerySchema
};
