const { z } = require('zod');

const subcategoryMutationSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional()
});

module.exports = { subcategoryMutationSchema };
