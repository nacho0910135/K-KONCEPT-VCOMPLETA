const { z } = require('zod');

const requestReplacementSchema = z.object({
  requestedProduct: z.string().trim().min(1),
  reason: z.string().trim().min(1)
});

const validateReplacementSchema = z.object({
  approved: z.boolean(),
  validationNotes: z.string().trim().optional()
}).refine((data) => data.approved || Boolean(data.validationNotes), {
  path: ['validationNotes'],
  message: 'Las notas de validacion son obligatorias al rechazar'
});

const newProductSchema = z.object({
  replacementProductId: z.string().uuid().optional(),
  replacementSerialNumber: z.string().trim().min(1),
  replacementBrand: z.string().trim().min(1),
  replacementModel: z.string().trim().min(1),
  replacementNotes: z.string().trim().optional()
});

const deliverySchema = z.object({
  deliveryDate: z.coerce.date(),
  deliveryObservations: z.string().trim().min(1)
});

module.exports = {
  requestReplacementSchema,
  validateReplacementSchema,
  newProductSchema,
  deliverySchema
};
