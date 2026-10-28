import { prisma } from '../../config/database.js';

const DISPLAY_ORDER = [{ position: 'asc' }, { createdAt: 'asc' }];

/**
 * Busca o cardápio publicável de um restaurante pelo slug.
 * Seleciona explicitamente apenas campos públicos e somente produtos disponíveis.
 */
export function findPublishedMenuBySlug(slug) {
  return prisma.restaurant.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      customization: {
        select: { logoKey: true, primaryColor: true, secondaryColor: true },
      },
      categories: {
        orderBy: DISPLAY_ORDER,
        select: {
          id: true,
          name: true,
          products: {
            where: { isAvailable: true },
            orderBy: DISPLAY_ORDER,
            select: { id: true, name: true, description: true, price: true, imageKey: true },
          },
        },
      },
    },
  });
}
