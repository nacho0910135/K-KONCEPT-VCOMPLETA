const { z } = require('zod');

const categoryMutationSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional()
});

const categoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  active: z.coerce.boolean().optional(),
  q: z.string().trim().optional()
});

module.exports = { categoryMutationSchema, categoryQuerySchema };
