import { z } from 'zod';

export const productStatusBodySchema = z
  .object({
    isActive: z.boolean('Use verdadeiro ou falso.').optional(),
    isAvailable: z.boolean('Use verdadeiro ou falso.').optional(),
  })
  .refine(
    (data) => data.isActive !== undefined || data.isAvailable !== undefined,
    'Informe isActive e/ou isAvailable.',
  );
