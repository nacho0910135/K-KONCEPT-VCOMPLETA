const { z } = require('zod');

const eventSchema = z.enum([
  'TICKET_CREATED',
  'TICKET_ASSIGNED',
  'STATUS_CHANGED',
  'NEW_COMMENT',
  'TICKET_RESOLVED',
  'TICKET_CLOSED',
  'APPOINTMENT_RESCHEDULED',
  'REPLACEMENT_APPROVED',
  'SLA_BREACH'
]);

const channelSchema = z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']);

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  read: z.coerce.boolean().optional()
});

const templateBaseSchema = z.object({
  event: eventSchema,
  channel: channelSchema,
  subject: z.string().trim().optional().nullable(),
  bodyTemplate: z.string().trim().min(1, 'bodyTemplate no puede estar vacio'),
  active: z.boolean().optional()
});

const templateSchema = templateBaseSchema.refine(
  (data) => data.channel !== 'EMAIL' || Boolean(data.subject && data.subject.trim()),
  {
    message: 'subject es requerido para plantillas EMAIL',
    path: ['subject']
  }
);

const templateUpdateSchema = templateBaseSchema.partial().refine(
  (data) => data.bodyTemplate === undefined || data.bodyTemplate.trim().length > 0,
  {
    message: 'bodyTemplate no puede estar vacio',
    path: ['bodyTemplate']
  }
).refine(
  (data) => data.channel !== 'EMAIL' || data.subject === undefined || Boolean(data.subject && data.subject.trim()),
  {
    message: 'subject es requerido para plantillas EMAIL',
    path: ['subject']
  }
);

const templateQuerySchema = z.object({
  event: eventSchema.optional(),
  channel: channelSchema.optional()
});

const channelUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional()
});

const frequencyRuleBaseSchema = z.object({
  event: eventSchema,
  maxPerUserPerHour: z.coerce.number().int().positive(),
  maxPerUserPerDay: z.coerce.number().int().positive(),
  active: z.boolean().optional()
});

const frequencyRuleSchema = frequencyRuleBaseSchema.refine(
  (data) => data.maxPerUserPerDay >= data.maxPerUserPerHour,
  {
    message: 'maxPerUserPerDay debe ser mayor o igual a maxPerUserPerHour',
    path: ['maxPerUserPerDay']
  }
);

const frequencyRuleUpdateSchema = frequencyRuleBaseSchema.partial().refine(
  (data) => (
    data.maxPerUserPerDay === undefined
    || data.maxPerUserPerHour === undefined
    || data.maxPerUserPerDay >= data.maxPerUserPerHour
  ),
  {
    message: 'maxPerUserPerDay debe ser mayor o igual a maxPerUserPerHour',
    path: ['maxPerUserPerDay']
  }
);

module.exports = {
  eventSchema,
  channelSchema,
  notificationQuerySchema,
  templateSchema,
  templateUpdateSchema,
  templateQuerySchema,
  channelUpdateSchema,
  frequencyRuleSchema,
  frequencyRuleUpdateSchema
};
