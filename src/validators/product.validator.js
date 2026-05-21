const { z } = require('zod');

const productMutationSchema = z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  serialNumber: z.string().trim().min(1),
  categoryId: z.string().uuid().optional(),
  description: z.string().trim().optional(),
  purchaseDate: z.coerce.date().optional()
});

const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  categoryId: z.string().uuid().optional(),
  q: z.string().trim().optional()
});

module.exports = { productMutationSchema, productQuerySchema };
