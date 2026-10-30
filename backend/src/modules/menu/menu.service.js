import { buildPublicFileUrl } from '../../config/storage.js';
import { subscribeToMenuUpdates } from '../../shared/events/menu-events.js';
import {
  ForbiddenError,
  NotFoundError,
  RestaurantSuspendedError,
} from '../../shared/errors/app-error.js';
import { getRestaurantFeatures, toFeatureFlags } from '../restaurants/restaurant-features.js';
import { findRestaurantStatusBySlug } from '../restaurants/restaurant.repository.js';
import * as menuRepository from './menu.repository.js';

const RESTAURANT_NOT_FOUND_MESSAGE = 'Restaurante não encontrado.';

/**
 * Retorna o cardápio público (somente dados publicáveis) do restaurante.
 * Restaurante suspenso pelo backoffice responde 403 RESTAURANT_SUSPENDED (DEC-006).
 */
export async function getPublicMenu(slug) {
  const restaurant = await menuRepository.findPublishedMenuBySlug(slug);
  if (!restaurant) throw new NotFoundError(RESTAURANT_NOT_FOUND_MESSAGE);
  if (restaurant.status === 'SUSPENDED') throw new RestaurantSuspendedError();
  return toPublicMenu(restaurant);
}

/**
 * Inscreve um ouvinte nas atualizações do cardápio de um restaurante.
 * Restaurantes suspensos continuam aceitando a conexão (o evento não carrega dados), para que o
 * cardápio aberto volte sozinho quando o restaurante for reativado — mesmo com a atualização
 * automática desligada, que só vale para o cardápio em funcionamento. Antes, o cardápio suspenso
 * sem esse módulo tentava reconectar a cada poucos segundos, sem fim.
 */
export async function subscribeToPublicMenu(slug, listener) {
  const restaurant = await findRestaurantStatusBySlug(slug);
  if (!restaurant) throw new NotFoundError(RESTAURANT_NOT_FOUND_MESSAGE);

  if (restaurant.status !== 'SUSPENDED') {
    const features = await getRestaurantFeatures(restaurant.id);
    if (!features.realtime) {
      throw new ForbiddenError('Atualização automática não liberada.', 'FEATURE_DISABLED');
    }
  }
  return subscribeToMenuUpdates(restaurant.id, listener);
}

function toPublicMenu(restaurant) {
  const features = toFeatureFlags(restaurant.features);
  // Sem o módulo de personalização, o cardápio usa a identidade visual padrão.
  const customization = features.customization ? restaurant.customization : null;

  return {
    restaurant: {
      slug: restaurant.slug,
      name: restaurant.name,
      logoUrl: buildPublicFileUrl(customization?.logoKey),
      primaryColor: customization?.primaryColor ?? null,
      secondaryColor: customization?.secondaryColor ?? null,
    },
    features: { realtime: features.realtime, productModal: features.productModal },
    // Categoria sem produtos publicáveis não aparece no cardápio público.
    categories: restaurant.categories
      .filter((category) => category.products.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          shortDescription: product.shortDescription,
          detailedDescription: product.detailedDescription,
          // Decimal serializado como string para não perder precisão no JSON.
          price: product.price.toFixed(2),
          imageUrl: buildPublicFileUrl(product.imageKey),
        })),
      })),
  };
}
