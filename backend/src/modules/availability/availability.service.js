import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import * as productRepository from '../products/product.repository.js';
import { toAdminProduct } from '../products/product.service.js';

/**
 * RF-014 / RF-015: define o produto como ativo/inativo e disponível/indisponível.
 * Inativos e indisponíveis somem do cardápio público (RF-016) e os cardápios abertos são avisados.
 */
export async function updateProductStatus(restaurantId, productId, { isActive, isAvailable }) {
  const product = await productRepository.update(restaurantId, productId, {
    ...(isActive !== undefined && { isActive }),
    ...(isAvailable !== undefined && { isAvailable }),
  });
  if (!product) throw new NotFoundError('Produto não encontrado.');

  publishMenuUpdated(restaurantId);
  return toAdminProduct(product);
}
