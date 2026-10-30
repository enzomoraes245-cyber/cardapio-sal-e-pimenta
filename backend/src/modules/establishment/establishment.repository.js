import { prisma } from '../../config/database.js';

const ESTABLISHMENT_SELECT = { name: true, slug: true, contactPhone: true, contactEmail: true };

export function findEstablishment(restaurantId, client = prisma) {
  return client.restaurant.findUnique({
    where: { id: restaurantId },
    select: ESTABLISHMENT_SELECT,
  });
}

export function updateEstablishment(tx, restaurantId, data) {
  return tx.restaurant.update({ where: { id: restaurantId }, data, select: ESTABLISHMENT_SELECT });
}
