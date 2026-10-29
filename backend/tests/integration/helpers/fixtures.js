import { randomUUID } from 'node:crypto';
import { prisma } from '../../../src/config/database.js';
import { deleteRestaurantFolder } from '../../../src/shared/utils/file-storage.js';

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
  const base = { restaurantId: restaurant.id, categoryId: category.id, price: '9.90' };
  const imageKey = `restaurants/${restaurant.id}/products/fixture.png`;
  await prisma.product.createMany({
    data: [
      { ...base, name: `Disponível ${label}`, price: '12.50', imageKey, position: 0 },
      { ...base, name: `Indisponível ${label}`, imageKey, isAvailable: false, position: 1 },
      { ...base, name: `Inativo ${label}`, imageKey, isActive: false, position: 2 },
      { ...base, name: `Sem foto ${label}`, position: 3 },
    ],
  });

  return { restaurant, category };
}

export async function deleteRestaurantFixtures(restaurantIds) {
  const where = { restaurantId: { in: restaurantIds } };
  await prisma.product.deleteMany({ where });
  await prisma.category.deleteMany({ where });
  await prisma.adminUser.deleteMany({ where });
  await prisma.restaurant.deleteMany({ where: { id: { in: restaurantIds } } });
  await Promise.all(restaurantIds.map((id) => deleteRestaurantFolder(id)));
}
