import { z } from 'zod';
import { PAYMENT_METHOD_LABELS } from '../utils/billing-labels.js';

/** Registro de pagamento (mesmas regras da API). `today` é "AAAA-MM-DD". */
export function paymentSchema(today) {
  return z.object({
    paidOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data do pagamento.')
      .refine((value) => value <= today, 'A data do pagamento não pode ser futura.'),
    method: z.enum(Object.keys(PAYMENT_METHOD_LABELS), 'Informe a forma de pagamento.'),
    notes: z.string().trim().max(300, 'Use no máximo 300 caracteres.'),
  });
}
