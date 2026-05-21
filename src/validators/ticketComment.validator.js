const { z } = require('zod');

const createTicketCommentSchema = z.object({
  comment: z.string().trim().min(1),
  isInternal: z.boolean().optional()
});

module.exports = { createTicketCommentSchema };
