import { z } from 'zod';
import { parseMoneyInput } from '../../../../utils/money-input.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(200, 'Use no máximo 200 caracteres.');

export const adminSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(120),
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('Informe um e-mail válido.')),
  password: passwordSchema,
});

export const subscriptionSchema = z.object({
  monthlyAmount: z.string().transform((value, context) => {
    const parsed = parseMoneyInput(value, { allowZero: true });
    if (!parsed) {
      context.addIssue({ code: 'custom', message: 'Informe um valor válido, ex.: 99,90.' });
      return z.NEVER;
    }
    return parsed;
  }),
  dueDay: z.coerce
    .number('Informe o dia.')
    .int('Use um número inteiro.')
    .min(1, 'Use um dia entre 1 e 28.')
    .max(28, 'Use um dia entre 1 e 28.'),
});

export const newRestaurantSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do restaurante.').max(120),
  slug: z
    .string()
    .min(2, 'Informe o endereço.')
    .max(80)
    .regex(SLUG_PATTERN, 'Use letras minúsculas, números e hífens.'),
  admin: adminSchema,
  subscription: subscriptionSchema,
  features: z.object({
    customization: z.boolean(),
    qrcode: z.boolean(),
    realtime: z.boolean(),
    productModal: z.boolean(),
  }),
});
