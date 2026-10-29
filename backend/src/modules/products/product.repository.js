import { prisma } from '../../config/database.js';

const PRODUCT_SELECT = {
  id: true,
  name: true,
  shortDescription: true,
  detailedDescription: true,
  price: true,
  imageKey: true,
  isActive: true,
  isAvailable: true,
  position: true,
  category: { select: { id: true, name: true } },
};

const DISPLAY_ORDER = [
  { category: { position: 'asc' } },
  { position: 'asc' },
  { createdAt: 'asc' },
];

export function listByRestaurant(restaurantId) {
  return prisma.product.findMany({
    where: { restaurantId },
    orderBy: DISPLAY_ORDER,
    select: PRODUCT_SELECT,
  });
}

export function listByCategory(restaurantId, categoryId) {
  return prisma.product.findMany({
    where: { restaurantId, categoryId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: PRODUCT_SELECT,
  });
}

/** Busca sempre pelo par (id, restaurante): produto de outro restaurante resulta em null. */
export function findById(restaurantId, id) {
  return prisma.product.findFirst({ where: { id, restaurantId }, select: PRODUCT_SELECT });
}

/** Próxima posição livre no fim da categoria. */
export async function nextPosition(restaurantId, categoryId) {
  const { _max } = await prisma.product.aggregate({
    where: { restaurantId, categoryId },
    _max: { position: true },
  });
  return (_max.position ?? -1) + 1;
}

export function create(restaurantId, data) {
  return prisma.product.create({ data: { ...data, restaurantId }, select: PRODUCT_SELECT });
}

export async function update(restaurantId, id, data) {
  const { count } = await prisma.product.updateMany({ where: { id, restaurantId }, data });
  return count === 0 ? null : findById(restaurantId, id);
}

export async function listIdsInCategory(restaurantId, categoryId) {
  const rows = await prisma.product.findMany({
    where: { restaurantId, categoryId },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function updatePositions(restaurantId, categoryId, orderedIds) {
  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.product.updateMany({ where: { id, restaurantId, categoryId }, data: { position } }),
    ),
  );
}
