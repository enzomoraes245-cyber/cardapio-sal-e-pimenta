import { z } from 'zod';
import { parseMoneyInput } from '../../../../utils/money-input.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(200, 'Use no máximo 200 caracteres.');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome.')
  .max(120, 'Use no máximo 120 caracteres.');
const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('Informe um e-mail válido.'));

/** Telefone opcional, com DDD (mesma regra da API). */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(20, 'Use no máximo 20 caracteres.')
  .refine(
    (value) =>
      value === '' || (/^[\d\s()+.-]+$/.test(value) && value.replace(/\D/g, '').length >= 10),
    'Informe um telefone válido, com DDD.',
  );

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Informe um e-mail válido.',
  );

export const adminSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const adminProfileSchema = z.object({ name: nameSchema, email: emailSchema });

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
  startedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início.')
    .optional(),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do restaurante.').max(120),
  contactPhone: optionalPhoneSchema.optional(),
  contactEmail: optionalEmailSchema.optional(),
});

export const newRestaurantSchema = registrationSchema.extend({
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
