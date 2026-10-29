import { prisma } from '../../config/database.js';

export function findByRestaurant(restaurantId) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      slug: true,
      name: true,
      customization: { select: { logoKey: true, primaryColor: true, secondaryColor: true } },
    },
  });
}

/** Atualiza nome (em Restaurant) e cores (em RestaurantCustomization) na mesma transação. */
export async function update(restaurantId, { name, ...colors }) {
  await prisma.$transaction(async (tx) => {
    if (name !== undefined) {
      await tx.restaurant.update({ where: { id: restaurantId }, data: { name } });
    }
    if (Object.keys(colors).length > 0) {
      await tx.restaurantCustomization.upsert({
        where: { restaurantId },
        update: colors,
        create: { restaurantId, ...colors },
      });
    }
  });
}

export function setLogoKey(restaurantId, logoKey) {
  return prisma.restaurantCustomization.upsert({
    where: { restaurantId },
    update: { logoKey },
    create: { restaurantId, logoKey },
  });
}
