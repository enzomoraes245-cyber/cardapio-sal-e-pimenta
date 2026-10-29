import { prisma } from '../../config/database.js';

/** Módulos liberáveis por restaurante (DEC-006): nome na API → chave no banco. */
export const FEATURES = Object.freeze({
  customization: 'CUSTOMIZATION',
  qrcode: 'QRCODE',
  realtime: 'REALTIME',
  productModal: 'PRODUCT_MODAL',
});

/**
 * Converte as linhas de restaurant_features em { customization, qrcode, realtime, productModal }.
 * Módulo sem linha é considerado liberado.
 */
export function toFeatureFlags(rows = []) {
  const flags = Object.fromEntries(Object.keys(FEATURES).map((name) => [name, true]));
  for (const row of rows) {
    const name = Object.keys(FEATURES).find((key) => FEATURES[key] === row.feature);
    if (name) flags[name] = row.enabled;
  }
  return flags;
}

export async function getRestaurantFeatures(restaurantId) {
  const rows = await prisma.restaurantFeature.findMany({
    where: { restaurantId },
    select: { feature: true, enabled: true },
  });
  return toFeatureFlags(rows);
}

/** Todos os módulos como [{ feature, enabled }], a partir de { customization: true, ... }. */
export function toFeatureEntries(flags = {}) {
  return Object.entries(FEATURES).map(([name, feature]) => ({
    feature,
    enabled: flags[name] ?? true,
  }));
}

/** Linhas de restaurant_features de um restaurante. */
export function toFeatureRows(restaurantId, flags) {
  return toFeatureEntries(flags).map((entry) => ({ restaurantId, ...entry }));
}
