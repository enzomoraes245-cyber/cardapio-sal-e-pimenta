import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.')
  .transform((value) => value.toLowerCase())
  .nullable()
  .optional();

export const customizationBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome do restaurante.')
      .max(120, 'Use no máximo 120 caracteres.')
      .optional(),
    primaryColor: hexColor,
    secondaryColor: hexColor,
  })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para alterar.');
