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

export function updateColors(restaurantId, colors) {
  return prisma.restaurantCustomization.upsert({
    where: { restaurantId },
    update: colors,
    create: { restaurantId, ...colors },
  });
}

/**
 * Troca a chave do logotipo com a linha bloqueada (SELECT ... FOR UPDATE), criando a linha no
 * primeiro envio. Trocas simultâneas ficam em sequência e cada uma devolve a chave substituída,
 * para que nenhum arquivo fique órfão. `logoKey` null remove o logotipo.
 */
export function swapLogoKey(restaurantId, logoKey) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO restaurant_customizations (restaurant_id, updated_at)
      VALUES (${restaurantId}::uuid, now())
      ON CONFLICT (restaurant_id) DO NOTHING`;
    const [row] = await tx.$queryRaw`
      SELECT logo_key FROM restaurant_customizations
      WHERE restaurant_id = ${restaurantId}::uuid
      FOR UPDATE`;
    await tx.restaurantCustomization.update({ where: { restaurantId }, data: { logoKey } });
    return { previousKey: row.logo_key };
  });
}
