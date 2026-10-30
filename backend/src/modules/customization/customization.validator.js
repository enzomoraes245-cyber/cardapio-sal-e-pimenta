import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.')
  .transform((value) => value.toLowerCase())
  .nullable()
  .optional();

/**
 * Cores da identidade visual (null volta à cor padrão do cardápio). O nome do restaurante é
 * alterado em "Dados do estabelecimento" (DEC-009), fora deste módulo.
 */
export const customizationBodySchema = z
  .object({ primaryColor: hexColor, secondaryColor: hexColor })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos uma cor para alterar.');
