import { api } from '../../../../services/api.js';

const base = '/platform/restaurants';

export function listRestaurants({ signal } = {}) {
  return api.get(base, { signal });
}

export function getRestaurant(id, { signal } = {}) {
  return api.get(`${base}/${id}`, { signal });
}

/**
 * { slug, name, contactPhone, contactEmail, admin, subscription, features }.
 * Com `idempotencyKey`, reenviar o mesmo formulário não duplica o restaurante.
 */
export function createRestaurant(data, { idempotencyKey } = {}) {
  return api.post(base, data, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/** Dados cadastrais: { name, contactPhone, contactEmail }. O slug nunca muda. */
export function updateRestaurant(id, data) {
  return api.patch(`${base}/${id}`, data);
}

export function suspendRestaurant(id, reason) {
  return api.post(`${base}/${id}/suspend`, { reason });
}

export function reactivateRestaurant(id, reason) {
  return api.post(`${base}/${id}/reactivate`, { reason });
}

/** { customization, qrcode, realtime, productModal } — todos booleanos. */
export function updateFeatures(id, features) {
  return api.put(`${base}/${id}/features`, features);
}

export function updateSubscription(id, subscription) {
  return api.put(`${base}/${id}/subscription`, subscription);
}

export function createAdmin(id, admin) {
  return api.post(`${base}/${id}/admins`, admin);
}

export function updateAdmin(id, adminId, data) {
  return api.patch(`${base}/${id}/admins/${adminId}`, data);
}

export function blockAdmin(id, adminId, reason) {
  return api.post(`${base}/${id}/admins/${adminId}/block`, { reason });
}

export function unblockAdmin(id, adminId, reason) {
  return api.post(`${base}/${id}/admins/${adminId}/unblock`, { reason });
}

export function resetAdminPassword(id, adminId, password) {
  return api.put(`${base}/${id}/admins/${adminId}/password`, { password });
}
