import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'tutor']),
  termsAccepted: z.literal(true, {
    message: 'Debes aceptar los términos',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
