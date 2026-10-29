import { prisma } from '../../config/database.js';

const DISPLAY_ORDER = [{ position: 'asc' }, { createdAt: 'asc' }];

/** Produto publicável: ativo, disponível e com foto (RN-004, RN-006, RN-007). */
export const PUBLISHED_PRODUCT_WHERE = Object.freeze({
  isActive: true,
  isAvailable: true,
  imageKey: { not: null },
});

/**
 * Busca o cardápio publicável de um restaurante pelo slug.
 * Seleciona explicitamente apenas campos públicos e somente produtos publicáveis.
 */
export function findPublishedMenuBySlug(slug) {
  return prisma.restaurant.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      status: true,
      features: { select: { feature: true, enabled: true } },
      customization: {
        select: { logoKey: true, primaryColor: true, secondaryColor: true },
      },
      categories: {
        orderBy: DISPLAY_ORDER,
        select: {
          id: true,
          name: true,
          products: {
            where: PUBLISHED_PRODUCT_WHERE,
            orderBy: DISPLAY_ORDER,
            select: {
              id: true,
              name: true,
              shortDescription: true,
              detailedDescription: true,
              price: true,
              imageKey: true,
            },
          },
        },
      },
    },
  });
}
