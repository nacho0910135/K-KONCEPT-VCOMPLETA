const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'TECHNICIAN', 'CLIENT']),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional()
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional()
});

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'TECHNICIAN', 'CLIENT']),
  confirm: z.literal(true)
});

const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'CLIENT', 'SYSTEM']).optional(),
  active: z.coerce.boolean().optional(),
  q: z.string().trim().optional()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  userQuerySchema
};
