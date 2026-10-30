import { api } from '../../../../services/api.js';

function withQuery(path, filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Mensalidades: { items, total, page, pageSize, sum }. Filtros: restaurantId, situation
 * (open, upcoming, overdue, paid, canceled), from e to (competência "AAAA-MM"), page, pageSize.
 */
export function listInvoices(filters, { signal } = {}) {
  return api.get(withQuery('/platform/invoices', filters), { signal });
}

/** Gera as mensalidades do mês ("AAAA-MM") para os restaurantes ativos; repetir não duplica. */
export function generateInvoices(month) {
  return api.post('/platform/invoices/generate', { month });
}

/** Registra o pagamento ({ paidOn, method, notes }); a chave evita registro duplicado. */
export function recordPayment(invoiceId, data, { idempotencyKey } = {}) {
  return api.post(`/platform/invoices/${invoiceId}/payments`, data, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function voidPayment(paymentId, reason) {
  return api.post(`/platform/payments/${paymentId}/void`, { reason });
}

export function cancelInvoice(invoiceId, reason) {
  return api.post(`/platform/invoices/${invoiceId}/cancel`, { reason });
}

export function reopenInvoice(invoiceId, reason) {
  return api.post(`/platform/invoices/${invoiceId}/reopen`, { reason });
}

/**
 * Pagamentos: { items, total, page, pageSize, validCount, sum } (total e soma sem estornados).
 * Filtros: restaurantId, from e to ("AAAA-MM-DD"), includeVoided, page, pageSize.
 */
export function listPayments(filters, { signal } = {}) {
  return api.get(withQuery('/platform/payments', filters), { signal });
}

/** Indicadores da plataforma; `from`/`to` definem o período dos pagamentos (padrão: mês atual). */
export function getOverview({ from, to } = {}, { signal } = {}) {
  return api.get(withQuery('/platform/overview', { from, to }), { signal });
}
