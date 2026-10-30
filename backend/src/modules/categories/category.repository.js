import { prisma } from '../../config/database.js';
import { PUBLISHED_PRODUCT_WHERE } from '../menu/menu.repository.js';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  position: true,
  isActive: true,
  _count: { select: { products: true } },
};

/**
 * `productCount`: todos os produtos da categoria. `publishableCount`: os que aparecem no
 * cardápio enquanto a categoria estiver ativa (ativos, disponíveis e com foto).
 */
function toCategory({ _count, ...category }, publishableCount = 0) {
  return { ...category, productCount: _count.products, publishableCount };
}

function countPublishable(restaurantId, categoryId, client = prisma) {
  return client.product.groupBy({
    by: ['categoryId'],
    where: { restaurantId, ...(categoryId && { categoryId }), ...PUBLISHED_PRODUCT_WHERE },
    _count: { _all: true },
  });
}

export async function listByRestaurant(restaurantId) {
  const [categories, publishable] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: CATEGORY_SELECT,
    }),
    countPublishable(restaurantId),
  ]);
  const counts = new Map(publishable.map((row) => [row.categoryId, row._count._all]));
  return categories.map((category) => toCategory(category, counts.get(category.id)));
}

export async function findById(restaurantId, id, client = prisma) {
  const category = await client.category.findFirst({
    where: { id, restaurantId },
    select: CATEGORY_SELECT,
  });
  if (!category) return null;
  const [publishable] = await countPublishable(restaurantId, id, client);
  return toCategory(category, publishable?._count._all);
}

/** Cria no fim da lista (na transação recebida, para não disputar a mesma posição). */
export async function create(restaurantId, { name }, client = prisma) {
  const { _max } = await client.category.aggregate({
    where: { restaurantId },
    _max: { position: true },
  });
  return client.category.create({
    data: { restaurantId, name, position: (_max.position ?? -1) + 1 },
    select: { id: true },
  });
}

/** Atualiza somente se a categoria pertencer ao restaurante. Retorna null caso contrário. */
export async function update(restaurantId, id, data) {
  const { count } = await prisma.category.updateMany({ where: { id, restaurantId }, data });
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
