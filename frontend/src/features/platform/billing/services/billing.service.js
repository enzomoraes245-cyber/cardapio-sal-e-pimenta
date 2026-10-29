import { api } from '../../../../services/api.js';

/** Filtros opcionais: { status, overdue, month, restaurantId }. */
export function listInvoices(filters = {}, { signal } = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
  const query = params.toString();
  return api.get(`/platform/invoices${query ? `?${query}` : ''}`, { signal });
}

/** Gera as faturas do mês ("AAAA-MM") para os restaurantes ativos; pode ser repetido. */
export function generateInvoices(month) {
  return api.post('/platform/invoices/generate', { month });
}

/** Baixa manual: 'PAID', 'OPEN' (reabrir) ou 'CANCELED'. */
export function updateInvoiceStatus(id, status) {
  return api.patch(`/platform/invoices/${id}`, { status });
}
