import { prisma } from '../../config/database.js';

/** Id e situação (ativo/suspenso) do restaurante pelo slug público. */
export function findRestaurantStatusBySlug(slug) {
  return prisma.restaurant.findUnique({ where: { slug }, select: { id: true, status: true } });
}
