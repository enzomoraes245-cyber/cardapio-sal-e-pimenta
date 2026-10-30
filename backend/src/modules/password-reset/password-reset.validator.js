import { z } from 'zod';
import { newPasswordSchema } from '../../shared/utils/common-schemas.js';
import { loginBodySchema } from '../auth/auth.validator.js';

export const forgotPasswordSchema = loginBodySchema.pick({ email: true });

export const resetPasswordSchema = z.object({
  token: z.string('Link inválido.').min(1, 'Link inválido.').max(256, 'Link inválido.'),
  password: newPasswordSchema,
});

/** Troca da própria senha (retaguarda e backoffice). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string('Informe a senha atual.').min(1, 'Informe a senha atual.').max(200),
    newPassword: newPasswordSchema,
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  });
