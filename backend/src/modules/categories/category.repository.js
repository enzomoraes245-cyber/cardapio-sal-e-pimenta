import { prisma } from '../../config/database.js';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  position: true,
  _count: { select: { products: true } },
};

function toCategory({ _count, ...category }) {
  return { ...category, productCount: _count.products };
}

export async function listByRestaurant(restaurantId) {
  const categories = await prisma.category.findMany({
    where: { restaurantId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: CATEGORY_SELECT,
  });
  return categories.map(toCategory);
}

export async function findById(restaurantId, id) {
  const category = await prisma.category.findFirst({
    where: { id, restaurantId },
    select: CATEGORY_SELECT,
  });
  return category && toCategory(category);
}

export async function create(restaurantId, { name }) {
  const { _max } = await prisma.category.aggregate({
    where: { restaurantId },
    _max: { position: true },
  });
  const category = await prisma.category.create({
    data: { restaurantId, name, position: (_max.position ?? -1) + 1 },
    select: CATEGORY_SELECT,
  });
  return toCategory(category);
}

/** Atualiza somente se a categoria pertencer ao restaurante. Retorna null caso contrário. */
export async function updateName(restaurantId, id, name) {
  const { count } = await prisma.category.updateMany({
    where: { id, restaurantId },
    data: { name },
  });
  return count === 0 ? null : findById(restaurantId, id);
}

export async function listIds(restaurantId) {
  const rows = await prisma.category.findMany({ where: { restaurantId }, select: { id: true } });
  return rows.map((row) => row.id);
}

export async function updatePositions(restaurantId, orderedIds) {
  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.category.updateMany({ where: { id, restaurantId }, data: { position } }),
    ),
  );
}
