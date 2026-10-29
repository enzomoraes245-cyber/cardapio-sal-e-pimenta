import { z } from 'zod';
import { moneySchema, newPasswordSchema } from '../../../shared/utils/common-schemas.js';
import { restaurantSlugSchema } from '../../restaurants/restaurant.validator.js';

const restaurantName = z
  .string('Informe o nome do restaurante.')
  .trim()
  .min(1, 'Informe o nome do restaurante.')
  .max(120, 'Use no máximo 120 caracteres.');

const adminSchema = z.object({
  name: z.string('Informe o nome.').trim().min(1, 'Informe o nome.').max(120),
  email: z
    .string('Informe o e-mail.')
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email('Informe um e-mail válido.')),
  password: newPasswordSchema,
});

export const subscriptionSchema = z.object({
  monthlyAmount: moneySchema,
  dueDay: z.coerce
    .number('Informe o dia de vencimento.')
    .int('Use um número inteiro.')
    .min(1, 'Use um dia entre 1 e 28.')
    .max(28, 'Use um dia entre 1 e 28.'),
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
  admin: adminSchema,
  subscription: subscriptionSchema,
  features: featuresSchema.partial().default({}),
});

export const updateRestaurantSchema = z.object({ name: restaurantName });

export const suspendRestaurantSchema = z.object({
  reason: z
    .string('Informe o motivo da suspensão.')
    .trim()
    .min(1, 'Informe o motivo da suspensão.')
    .max(300, 'Use no máximo 300 caracteres.'),
});

export const createAdminSchema = adminSchema;

export const adminPasswordSchema = z.object({ password: newPasswordSchema });

export const restaurantAdminParamsSchema = z.object({
  id: z.uuid('Identificador inválido.'),
  adminId: z.uuid('Identificador inválido.'),
});
