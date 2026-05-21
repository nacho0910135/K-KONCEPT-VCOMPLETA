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
