import { buildPublicFileUrl } from '../../config/storage.js';
import { subscribeToMenuUpdates } from '../../shared/events/menu-events.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { findRestaurantIdBySlug } from '../restaurants/restaurant.repository.js';
import * as menuRepository from './menu.repository.js';

const RESTAURANT_NOT_FOUND_MESSAGE = 'Restaurante não encontrado.';

/** Retorna o cardápio público (somente dados publicáveis) do restaurante. */
export async function getPublicMenu(slug) {
  const restaurant = await menuRepository.findPublishedMenuBySlug(slug);
  if (!restaurant) throw new NotFoundError(RESTAURANT_NOT_FOUND_MESSAGE);
  return toPublicMenu(restaurant);
}

/**
 * Inscreve um ouvinte nas atualizações do cardápio de um restaurante.
 * Lança NotFoundError antes de qualquer inscrição se o slug não existir.
 */
export async function subscribeToPublicMenu(slug, listener) {
  const restaurant = await findRestaurantIdBySlug(slug);
  if (!restaurant) throw new NotFoundError(RESTAURANT_NOT_FOUND_MESSAGE);
  return subscribeToMenuUpdates(restaurant.id, listener);
}

function toPublicMenu(restaurant) {
  const { customization } = restaurant;

  return {
    restaurant: {
      slug: restaurant.slug,
      name: restaurant.name,
      logoUrl: buildPublicFileUrl(customization?.logoKey),
      primaryColor: customization?.primaryColor ?? null,
      secondaryColor: customization?.secondaryColor ?? null,
    },
    categories: restaurant.categories.map((category) => ({
      id: category.id,
      name: category.name,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        // Decimal serializado como string para não perder precisão no JSON.
        price: product.price.toFixed(2),
        imageUrl: buildPublicFileUrl(product.imageKey),
      })),
    })),
  };
}
