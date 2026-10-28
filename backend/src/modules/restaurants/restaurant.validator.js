import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Identificador público do restaurante na URL: minúsculas, números e hífens. */
export const restaurantSlugSchema = z
  .string()
  .min(2, 'Identificador muito curto.')
  .max(80, 'Identificador muito longo.')
  .regex(SLUG_PATTERN, 'Identificador inválido.');
