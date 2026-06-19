const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contrasena debe incluir al menos una mayuscula')
  .regex(/[0-9]/, 'La contrasena debe incluir al menos un numero');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('Email invalido'),
  password: passwordSchema,
  phone: z.string().trim().optional(),
  company: z.string().trim().optional()
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria')
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalido')
});

const passwordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalido'),
  code: z.string().trim().regex(/^\d{6}$/, 'El codigo debe tener 6 digitos'),
  password: passwordSchema
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido')
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshSchema,
  logoutSchema
};
