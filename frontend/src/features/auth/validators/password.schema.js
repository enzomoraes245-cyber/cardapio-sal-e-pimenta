import { z } from 'zod';
import { loginSchema } from './login.schema.js';

const newPassword = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(200, 'Use no máximo 200 caracteres.');

const passwordsMatch = {
  path: ['confirmPassword'],
  message: 'As senhas não conferem.',
};

export const forgotPasswordSchema = loginSchema.pick({ email: true });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, passwordsMatch)
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  });
