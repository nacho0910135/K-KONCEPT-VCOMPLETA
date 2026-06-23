const { z } = require('zod');

const subcategoryMutationSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  products: z.array(z.string().trim().min(1)).optional()
});

module.exports = { subcategoryMutationSchema };
