import { api } from '../../../services/api.js';

export function listProducts({ signal } = {}) {
  return api.get('/admin/products', { signal });
}

export function getProduct(id, { signal } = {}) {
  return api.get(`/admin/products/${id}`, { signal });
}

/** Cadastro com foto: enviado como multipart/form-data. */
export function createProduct({ image, ...fields }) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value ?? ''));
  form.append('image', image);
  return api.post('/admin/products', form);
}

export function updateProduct(id, fields) {
  return api.patch(`/admin/products/${id}`, fields);
}

export function replaceProductImage(id, image) {
  const form = new FormData();
  form.append('image', image);
  return api.put(`/admin/products/${id}/image`, form);
}

/** Envia todos os produtos da categoria na nova ordem. */
export function reorderProducts(categoryId, ids) {
  return api.put(`/admin/categories/${categoryId}/products/order`, { ids });
}
