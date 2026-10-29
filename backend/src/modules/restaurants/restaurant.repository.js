import { prisma } from '../../config/database.js';

export function findRestaurantIdBySlug(slug) {
  return prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
}

export function findSlugById(id) {
  return prisma.restaurant.findUnique({ where: { id }, select: { slug: true } });
}
