const { z } = require('zod');

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().max(2000).optional(),
  attachmentUrl: z.string().max(900000).optional(),
  attachmentType: z.enum(['IMAGE', 'AUDIO']).optional()
}).refine((value) => value.body || value.attachmentUrl, { message: 'Mensaje vacio' });

module.exports = { sendMessageSchema };
