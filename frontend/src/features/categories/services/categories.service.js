import { api } from '../../../services/api.js';

export function listCategories({ signal } = {}) {
  return api.get('/admin/categories', { signal });
}

/** Com `idempotencyKey`, reenviar o mesmo formulário não duplica a categoria. */
export function createCategory({ name }, { idempotencyKey } = {}) {
  return api.post(
    '/admin/categories',
    { name },
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
  );
}

export function renameCategory(id, { name }) {
  return api.patch(`/admin/categories/${id}`, { name });
}

/** Exibe (true) ou oculta (false) a categoria no cardápio; os produtos são mantidos. */
export function setCategoryStatus(id, isActive) {
  return api.patch(`/admin/categories/${id}/status`, { isActive });
}

/** Envia a lista completa de ids na nova ordem. */
export function reorderCategories(ids) {
  return api.put('/admin/categories/order', { ids });
}
