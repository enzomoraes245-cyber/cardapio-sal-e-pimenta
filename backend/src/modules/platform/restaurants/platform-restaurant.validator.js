import { z } from 'zod';
import {
  isoDateSchema,
  moneySchema,
  newPasswordSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  reasonSchema,
} from '../../../shared/utils/common-schemas.js';
import { restaurantSlugSchema } from '../../restaurants/restaurant.validator.js';

const restaurantName = z
  .string('Informe o nome do restaurante.')
  .trim()
  .min(1, 'Informe o nome do restaurante.')
  .max(120, 'Use no máximo 120 caracteres.');

const adminName = z.string('Informe o nome.').trim().min(1, 'Informe o nome.').max(120);
const adminEmail = z
  .string('Informe o e-mail.')
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Informe um e-mail válido.'));

const adminSchema = z.object({ name: adminName, email: adminEmail, password: newPasswordSchema });

const optionalReasonSchema = z
  .string()
  .trim()
  .max(300, 'Use no máximo 300 caracteres.')
  .transform((value) => value || null)
  .nullish();

export const subscriptionSchema = z.object({
  monthlyAmount: moneySchema,
  dueDay: z.coerce
    .number('Informe o dia de vencimento.')
    .int('Use um número inteiro.')
    .min(1, 'Use um dia entre 1 e 28.')
    .max(28, 'Use um dia entre 1 e 28.'),
  /** Início da cobrança. Na criação, o padrão é hoje (fuso do negócio). */
  startedAt: isoDateSchema.optional(),
});

export const featuresSchema = z.object({
  customization: z.boolean(),
  qrcode: z.boolean(),
  realtime: z.boolean(),
  productModal: z.boolean(),
});

export const createRestaurantSchema = z.object({
  slug: restaurantSlugSchema,
  name: restaurantName,
  contactPhone: optionalPhoneSchema,
  contactEmail: optionalEmailSchema,
  admin: adminSchema,
  subscription: subscriptionSchema,
  features: featuresSchema.partial().default({}),
});

/** Dados cadastrais. Campo ausente não muda; contato vazio é apagado. */
export const updateRestaurantSchema = z.object({
  name: restaurantName,
  contactPhone: optionalPhoneSchema,
  contactEmail: optionalEmailSchema,
});

export const suspendRestaurantSchema = z.object({
  reason: reasonSchema('Informe o motivo da suspensão.'),
});

export const reactivateRestaurantSchema = z.object({
  reason: reasonSchema('Informe o motivo da reativação.'),
});

export const createAdminSchema = adminSchema;

export const updateAdminSchema = z
  .object({ name: adminName.optional(), email: adminEmail.optional() })
  .refine((value) => value.name !== undefined || value.email !== undefined, {
    message: 'Informe o nome ou o e-mail.',
  });

export const adminAccessSchema = z.object({ reason: optionalReasonSchema });

export const adminPasswordSchema = z.object({ password: newPasswordSchema });

export const restaurantAdminParamsSchema = z.object({
  id: z.uuid('Identificador inválido.'),
  adminId: z.uuid('Identificador inválido.'),
});
