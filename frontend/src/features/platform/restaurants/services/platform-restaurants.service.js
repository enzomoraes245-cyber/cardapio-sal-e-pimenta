import { api } from '../../../../services/api.js';

const base = '/platform/restaurants';

export function listRestaurants({ signal } = {}) {
  return api.get(base, { signal });
}

export function getRestaurant(id, { signal } = {}) {
  return api.get(`${base}/${id}`, { signal });
}

/** { slug, name, admin: { name, email, password }, subscription, features } */
export function createRestaurant(data) {
  return api.post(base, data);
}

export function renameRestaurant(id, name) {
  return api.patch(`${base}/${id}`, { name });
}

export function suspendRestaurant(id, reason) {
  return api.post(`${base}/${id}/suspend`, { reason });
}

export function reactivateRestaurant(id) {
  return api.post(`${base}/${id}/reactivate`);
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

export function resetAdminPassword(id, adminId, password) {
  return api.put(`${base}/${id}/admins/${adminId}/password`, { password });
}
