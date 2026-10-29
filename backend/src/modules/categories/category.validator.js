import { z } from 'zod';

export const categoryBodySchema = z.object({
  name: z
    .string('Informe o nome da categoria.')
    .trim()
    .min(1, 'Informe o nome da categoria.')
    .max(80, 'Use no máximo 80 caracteres.'),
});
