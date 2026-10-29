import { getRestaurantFeatures } from '../modules/restaurants/restaurant-features.js';
import { ForbiddenError } from '../shared/errors/app-error.js';

/**
 * Bloqueia rotas administrativas de módulos não liberados para o restaurante (DEC-006).
 * Deve ser usado depois de requireTenant.
 * @param {'customization' | 'qrcode' | 'realtime' | 'productModal'} feature
 */
export function requireFeature(feature) {
  return async function checkFeature(req, res, next) {
    const features = await getRestaurantFeatures(req.tenant.restaurantId);
    if (!features[feature]) {
      throw new ForbiddenError(
        'Este módulo não está liberado para o seu restaurante.',
        'FEATURE_DISABLED',
      );
    }
    next();
  };
}
