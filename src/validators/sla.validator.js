const { z } = require('zod');

const positiveHours = z.coerce.number().int().positive();
const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const validateHoursOrder = (data) => data.maxResolutionHours >= data.maxResponseHours;
const hoursOrderMessage = {
  message: 'maxResolutionHours debe ser mayor o igual a maxResponseHours',
  path: ['maxResolutionHours']
};

const createSlaSchema = z.object({
  name: z.string().trim().min(2),
  priority: prioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  maxResponseHours: positiveHours,
  maxResolutionHours: positiveHours
}).refine(
  (data) => Boolean(data.priority || data.categoryId || data.clientId),
  {
    message: 'Debe indicar al menos priority, categoryId o clientId',
    path: ['priority']
  }
).refine(validateHoursOrder, hoursOrderMessage);

const updateSlaSchema = z.object({
  maxResponseHours: positiveHours,
  maxResolutionHours: positiveHours,
  scope: z.enum(['NEW_ONLY', 'RECALCULATE_OPEN'])
}).refine(validateHoursOrder, hoursOrderMessage);

const slaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  priority: prioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  active: z.coerce.boolean().optional(),
  includeVersions: z.coerce.boolean().optional()
});

module.exports = {
  createSlaSchema,
  updateSlaSchema,
  slaQuerySchema
};
