import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresa un email valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres')
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Ingresa tu nombre'),
  phone: z.string().optional(),
  company: z.string().optional()
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Ingresa un email valido')
});

export const passwordResetSchema = z.object({
  email: z.string().email('Ingresa un email valido'),
  code: z.string().regex(/^\d{6}$/, 'Ingresa el codigo de 6 digitos'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Incluye al menos una mayuscula')
    .regex(/[0-9]/, 'Incluye al menos un numero')
});
