import { randomUUID } from 'node:crypto';
import { prisma } from '../../../src/config/database.js';

/**
 * Cria um restaurante isolado para testes, com uma categoria e produtos.
 * O slug é único por execução, então os testes não interferem nos dados de desenvolvimento.
 */
export async function createRestaurantFixture(label) {
  const slug = `test-${label}-${randomUUID().slice(0, 8)}`;
  const restaurant = await prisma.restaurant.create({
    data: {
      slug,
      name: `Restaurante ${label}`,
      customization: { create: { primaryColor: '#123456' } },
    },
  });
  const category = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: `Categoria ${label}`, position: 0 },
  });
  await prisma.product.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: `Disponível ${label}`,
        price: '12.50',
        position: 0,
      },
      {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: `Indisponível ${label}`,
        price: '9.90',
        isAvailable: false,
        position: 1,
      },
    ],
  });

  return { restaurant, category };
}

export async function deleteRestaurantFixtures(restaurantIds) {
  const where = { restaurantId: { in: restaurantIds } };
  await prisma.product.deleteMany({ where });
  await prisma.category.deleteMany({ where });
  await prisma.restaurant.deleteMany({ where: { id: { in: restaurantIds } } });
}
