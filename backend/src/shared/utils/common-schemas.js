import { z } from 'zod';

export const idParamsSchema = z.object({ id: z.uuid('Identificador inválido.') });

/** Lista ordenada de ids (reordenação de categorias e produtos). */
export const orderBodySchema = z.object({
  ids: z.array(z.uuid('Identificador inválido.')).min(1).max(1000),
});

/** Texto opcional: string vazia vira null. */
export function optionalText(max) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || null)
    .nullish();
}
