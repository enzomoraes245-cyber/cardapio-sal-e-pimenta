import { api } from '../../../services/api.js';

/** Altera a situação do produto: { isActive?, isAvailable? }. */
export function updateProductStatus(productId, status) {
  return api.patch(`/admin/products/${productId}/status`, status);
}
