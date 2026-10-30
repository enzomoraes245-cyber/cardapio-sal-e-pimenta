import { z } from 'zod';
import {
  optionalEmailSchema,
  optionalPhoneSchema,
} from '../../platform/restaurants/validators/restaurant.schema.js';

export const establishmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do restaurante.')
    .max(120, 'Use no máximo 120 caracteres.'),
  contactPhone: optionalPhoneSchema,
  contactEmail: optionalEmailSchema,
});
