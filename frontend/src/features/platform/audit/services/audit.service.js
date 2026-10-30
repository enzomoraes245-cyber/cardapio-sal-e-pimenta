import { api } from '../../../../services/api.js';

/** Histórico de ações (mais recente primeiro), opcionalmente de um restaurante. */
export function listAuditEvents({ restaurantId, page = 1, pageSize = 20 } = {}, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (restaurantId) params.set('restaurantId', restaurantId);
  return api.get(`/platform/audit-events?${params}`, { signal });
}
