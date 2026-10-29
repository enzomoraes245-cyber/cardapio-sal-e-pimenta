import { z } from 'zod';
import { optionalText } from '../../shared/utils/common-schemas.js';

// Até 8 dígitos inteiros e 2 decimais: cabe em NUMERIC(10,2).
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

/** Preço válido (RN-004): aceita "12,50", "12.50" ou 12.5; resulta em string decimal. */
export const priceSchema = z
  .union([z.string(), z.number()], 'Informe o preço.')
  .transform((value) => String(value).trim().replace(',', '.'))
  .pipe(
    z
      .string()
      .min(1, 'Informe o preço.')
      .regex(PRICE_PATTERN, 'Informe um preço válido, com até 2 casas decimais.')
      .refine((value) => Number(value) > 0, 'O preço deve ser maior que zero.'),
  );

const productFields = {
  name: z
    .string('Informe o nome do produto.')
    .trim()
    .min(1, 'Informe o nome do produto.')
    .max(120, 'Use no máximo 120 caracteres.'),
  shortDescription: optionalText(300),
  detailedDescription: optionalText(2000),
  price: priceSchema,
  categoryId: z.uuid('Selecione uma categoria.'),
};

/** Cadastro via multipart/form-data: situação chega como texto ("true"/"false"). */
export const createProductBodySchema = z.object({
  ...productFields,
  isActive: z.stringbool().default(true),
  isAvailable: z.stringbool().default(true),
});

export const updateProductBodySchema = z
  .object(productFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para alterar.');

export const categoryProductsParamsSchema = z.object({
  categoryId: z.uuid('Identificador inválido.'),
});
