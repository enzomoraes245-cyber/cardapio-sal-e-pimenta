import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.');

export const customizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do restaurante.')
    .max(120, 'Use no máximo 120 caracteres.'),
  primaryColor: hexColor,
  secondaryColor: hexColor,
});
