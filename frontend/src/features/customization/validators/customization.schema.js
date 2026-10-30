import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.');

/** Cores da identidade visual. O nome fica em "Dados do estabelecimento" (DEC-009). */
export const customizationSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
});
