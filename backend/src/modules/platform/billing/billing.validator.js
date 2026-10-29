import { z } from 'zod';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthSchema = z.string().regex(MONTH_PATTERN, 'Use o formato AAAA-MM.');

export const generateInvoicesSchema = z.object({ month: monthSchema });

export const listInvoicesQuerySchema = z.object({
  status: z.enum(['OPEN', 'PAID', 'CANCELED']).optional(),
  overdue: z.stringbool().optional(),
  month: monthSchema.optional(),
  restaurantId: z.uuid().optional(),
});

/** Baixa manual: marcar como paga, reabrir ou cancelar. */
export const updateInvoiceSchema = z.object({
  status: z.enum(['OPEN', 'PAID', 'CANCELED'], 'Use OPEN, PAID ou CANCELED.'),
});
