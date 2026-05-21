const { z } = require('zod');

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

const ticketIdParamSchema = z.object({
  id: z.string().uuid('ID de ticket invalido')
});

const createTicketSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  warrantyId: z.string().uuid().optional()
});

const ticketPreviewSchema = createTicketSchema;

const myTicketsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED']).optional(),
  categoryId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().optional()
});

const assignedTicketsQuerySchema = paginationQuerySchema.extend({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED']).optional()
});

const adminTicketsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  categoryId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().optional()
});

const resolvedCloseSchema = z.discriminatedUnion('closeType', [
  z.object({
    status: z.literal('RESOLVED'),
    closeType: z.literal('WITH_SOLUTION'),
    diagnosis: z.string().trim().min(1),
    solution: z.string().trim().min(1),
    comment: z.string().trim().optional()
  }),
  z.object({
    status: z.literal('RESOLVED'),
    closeType: z.literal('WITHOUT_SOLUTION'),
    closeJustification: z.string().trim().min(1),
    comment: z.string().trim().optional()
  }),
  z.object({
    status: z.literal('RESOLVED'),
    closeType: z.literal('REPLACEMENT'),
    diagnosis: z.string().trim().optional(),
    solution: z.string().trim().optional(),
    comment: z.string().trim().optional()
  })
]);

const changeStatusSchema = z.union([
  z.object({ status: z.literal('IN_PROGRESS'), comment: z.string().trim().min(1) }),
  z.object({ status: z.literal('PENDING'), comment: z.string().trim().min(1) }),
  z.object({ status: z.literal('WAITING_CUSTOMER'), comment: z.string().trim().min(1) }),
  z.object({ status: z.literal('CANCELLED'), comment: z.string().trim().min(1) }),
  resolvedCloseSchema
]);

const confirmSolutionSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  ratingComment: z.string().trim().optional()
});

const rejectSolutionSchema = z.object({
  reason: z.string().trim().min(1)
});

const assignTicketSchema = z.object({
  technicianId: z.string().uuid()
});

const updatePrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

const updateDiagnosisSchema = z.object({
  diagnosis: z.string().trim().min(1)
});

const searchTicketsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1)
});

module.exports = {
  createTicketSchema,
  ticketIdParamSchema,
  ticketPreviewSchema,
  myTicketsQuerySchema,
  assignedTicketsQuerySchema,
  adminTicketsQuerySchema,
  changeStatusSchema,
  confirmSolutionSchema,
  rejectSolutionSchema,
  assignTicketSchema,
  updatePrioritySchema,
  updateDiagnosisSchema,
  searchTicketsQuerySchema
};
