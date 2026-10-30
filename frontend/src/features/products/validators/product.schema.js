import { z } from 'zod';
import { parseMoneyInput } from '../../../utils/money-input.js';

const optionalText = (max) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);

/** Nome, preço válido e categoria são obrigatórios; a foto é opcional (DEC-007). */
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do produto.')
    .max(120, 'Use no máximo 120 caracteres.'),
  price: z
    .string()
    .min(1, 'Informe o preço.')
    .transform((value, context) => {
      const parsed = parseMoneyInput(value);
      if (!parsed) {
        context.addIssue({ code: 'custom', message: 'Informe um preço válido, ex.: 12,50.' });
        return z.NEVER;
      }
      return parsed;
    }),
  categoryId: z.string().min(1, 'Selecione a categoria.'),
  shortDescription: optionalText(300),
  detailedDescription: optionalText(2000),
  image: z.instanceof(File).nullable(),
  removeImage: z.boolean().default(false),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
});
