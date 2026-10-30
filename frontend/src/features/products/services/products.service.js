import { api } from '../../../services/api.js';

export function listProducts({ signal } = {}) {
  return api.get('/admin/products', { signal });
}

export function getProduct(id, { signal } = {}) {
  return api.get(`/admin/products/${id}`, { signal });
}

/**
 * Cadastro em multipart/form-data; a foto é opcional (DEC-007).
 * Com `idempotencyKey`, reenviar o formulário não duplica o produto.
 */
export function createProduct({ image, ...fields }, { idempotencyKey } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value ?? ''));
  if (image) form.append('image', image);
  return api.post('/admin/products', form, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function updateProduct(id, fields) {
  return api.patch(`/admin/products/${id}`, fields);
}

export function replaceProductImage(id, image) {
  const form = new FormData();
  form.append('image', image);
  return api.put(`/admin/products/${id}/image`, form);
}

/** Remove a foto: o produto continua salvo, mas sai do cardápio até receber outra. */
export function removeProductImage(id) {
  return api.delete(`/admin/products/${id}/image`);
}

/** Envia todos os produtos da categoria na nova ordem. */
export function reorderProducts(categoryId, ids) {
  return api.put(`/admin/categories/${categoryId}/products/order`, { ids });
}
