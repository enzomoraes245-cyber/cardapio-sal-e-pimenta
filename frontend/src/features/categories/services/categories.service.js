import { api } from '../../../services/api.js';

export function listCategories({ signal } = {}) {
  return api.get('/admin/categories', { signal });
}

export function createCategory({ name }) {
  return api.post('/admin/categories', { name });
}

export function renameCategory(id, { name }) {
  return api.patch(`/admin/categories/${id}`, { name });
}

/** Envia a lista completa de ids na nova ordem. */
export function reorderCategories(ids) {
  return api.put('/admin/categories/order', { ids });
}
