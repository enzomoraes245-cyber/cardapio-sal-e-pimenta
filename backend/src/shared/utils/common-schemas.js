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

/** Motivo obrigatório de uma ação (suspensão, cancelamento, estorno...), até 300 caracteres. */
export const reasonSchema = (message) =>
  z.string(message).trim().min(1, message).max(300, 'Use no máximo 300 caracteres.');

/** Data "AAAA-MM-DD" válida (rejeita, por exemplo, 2026-02-30). */
export const isoDateSchema = z
  .string('Informe a data.')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Informe uma data válida.');

/** Telefone opcional (com DDD): dígitos, espaços, parênteses, "+", "-" e "."; vazio vira null. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(20, 'Use no máximo 20 caracteres.')
  .refine(
    (value) =>
      value === '' || (/^[\d\s()+.-]+$/.test(value) && value.replace(/\D/g, '').length >= 10),
    'Informe um telefone válido, com DDD.',
  )
  .transform((value) => value || null)
  .nullish();

/** E-mail opcional, em minúsculas; vazio vira null. */
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Use no máximo 254 caracteres.')
  .refine(
    (value) => value === '' || z.email().safeParse(value).success,
    'Informe um e-mail válido.',
  )
  .transform((value) => value || null)
  .nullish();

/** Paginação das listagens: página a partir de 1 e tamanho entre 1 e 100. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
