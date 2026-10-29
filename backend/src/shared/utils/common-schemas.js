import { z } from 'zod';

export const idParamsSchema = z.object({ id: z.uuid('Identificador inválido.') });

/** Lista ordenada de ids (reordenação de categorias e produtos). */
export const orderBodySchema = z.object({
  ids: z.array(z.uuid('Identificador inválido.')).min(1).max(1000),
});

/** Valor monetário >= 0 com até 2 casas ("99,90", "99.9" ou 99.9) → string decimal. */
export const moneySchema = z
  .union([z.string(), z.number()], 'Informe o valor.')
  .transform((value) => String(value).trim().replace(',', '.'))
  .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Informe um valor válido, com até 2 casas.'));

/** Senha definida pelo backoffice para administradores. */
export const newPasswordSchema = z
  .string('Informe a senha.')
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(200, 'Use no máximo 200 caracteres.');

/** Texto opcional: string vazia vira null. */
export function optionalText(max) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || null)
    .nullish();
}
