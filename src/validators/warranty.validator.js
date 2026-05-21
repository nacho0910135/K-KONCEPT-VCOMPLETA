const { z } = require('zod');

const warrantyMutationSchema = z.object({
  productId: z.string().uuid(),
  clientId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  notes: z.string().trim().optional()
}).refine((data) => data.endDate >= data.startDate, {
  path: ['endDate'],
  message: 'La fecha final debe ser mayor o igual a la fecha inicial'
});

const warrantyUpdateSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().trim().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) return data.endDate >= data.startDate;
  return true;
}, {
  path: ['endDate'],
  message: 'La fecha final debe ser mayor o igual a la fecha inicial'
});

const warrantyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  clientId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  status: z.enum(['VALID', 'EXPIRED', 'NOT_APPLICABLE']).optional()
});

const warrantyValidateQuerySchema = z.object({
  productSerial: z.string().trim().optional(),
  productId: z.string().uuid().optional()
}).refine((data) => data.productSerial || data.productId, {
  message: 'Debe enviar productSerial o productId'
});

module.exports = {
  warrantyMutationSchema,
  warrantyUpdateSchema,
  warrantyQuerySchema,
  warrantyValidateQuerySchema
};
