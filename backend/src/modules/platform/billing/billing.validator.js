import { z } from 'zod';
import {
  isoDateSchema,
  optionalText,
  paginationQuerySchema,
  reasonSchema,
} from '../../../shared/utils/common-schemas.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthSchema = z.string().regex(MONTH_PATTERN, 'Use o formato AAAA-MM.');

export const generateInvoicesSchema = z.object({ month: monthSchema });

/**
 * Situação de uma mensalidade: "open" (em aberto, vencida ou não), "upcoming" (em aberto, vence
 * hoje ou depois), "overdue" (em aberto, venceu antes de hoje), "paid" e "canceled".
 */
export const INVOICE_SITUATIONS = ['open', 'upcoming', 'overdue', 'paid', 'canceled'];

export const PAYMENT_METHODS = ['PIX', 'BOLETO', 'TRANSFER', 'CARD', 'CASH', 'OTHER'];

/** Início e fim do intervalo, quando os dois são informados, em ordem. */
const orderedRange = (message) => [
  ({ from, to }) => !from || !to || from <= to,
  { path: ['to'], message },
];

export const listInvoicesQuerySchema = paginationQuerySchema
  .extend({
    restaurantId: z.uuid('Identificador inválido.').optional(),
    situation: z.enum(INVOICE_SITUATIONS, 'Situação inválida.').optional(),
    /** Competência (mês de referência) inicial e final, inclusive. */
    from: monthSchema.optional(),
    to: monthSchema.optional(),
  })
  .refine(...orderedRange('O mês final deve ser igual ou posterior ao inicial.'));

export const listPaymentsQuerySchema = paginationQuerySchema
  .extend({
    restaurantId: z.uuid('Identificador inválido.').optional(),
    /** Data do pagamento inicial e final, inclusive. */
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    includeVoided: z.stringbool().default(false),
  })
  .refine(...orderedRange('A data final deve ser igual ou posterior à inicial.'));

/** Período dos pagamentos na visão geral; sem datas, o mês atual. */
export const overviewQuerySchema = z
  .object({ from: isoDateSchema.optional(), to: isoDateSchema.optional() })
  .refine(({ from, to }) => Boolean(from) === Boolean(to), {
    path: ['to'],
    message: 'Informe as duas datas do período.',
  })
  .refine(...orderedRange('A data final deve ser igual ou posterior à inicial.'));

/** Registro manual de pagamento: o valor é sempre o da mensalidade. */
export const recordPaymentSchema = z.object({
  paidOn: isoDateSchema,
  method: z.enum(PAYMENT_METHODS, 'Informe a forma de pagamento.'),
  notes: optionalText(300),
});

export const cancelInvoiceSchema = z.object({
  reason: reasonSchema('Informe o motivo do cancelamento.'),
});

export const reopenInvoiceSchema = z.object({
  reason: reasonSchema('Informe o motivo da reabertura.'),
});

export const voidPaymentSchema = z.object({
  reason: reasonSchema('Informe o motivo do estorno.'),
});
