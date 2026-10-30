import { z } from 'zod';
import { optionalEmailSchema, optionalPhoneSchema } from '../../shared/utils/common-schemas.js';

/** Dados que o próprio restaurante mantém: nome de exibição e contato (uso interno). */
export const establishmentBodySchema = z.object({
  name: z
    .string('Informe o nome do restaurante.')
    .trim()
    .min(1, 'Informe o nome do restaurante.')
    .max(120, 'Use no máximo 120 caracteres.'),
  contactPhone: optionalPhoneSchema,
  contactEmail: optionalEmailSchema,
});
