import { prisma } from '../../../config/database.js';

const SUMMARY_SELECT = (today) => ({
  id: true,
  slug: true,
  name: true,
  status: true,
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  subscription: { select: { monthlyAmount: true, dueDay: true, startedAt: true } },
  features: { select: { feature: true, enabled: true } },
  _count: { select: { invoices: { where: { status: 'OPEN', dueDate: { lt: today } } } } },
});

export function listRestaurants(today) {
  return prisma.restaurant.findMany({
    orderBy: { name: 'asc' },
    select: SUMMARY_SELECT(today),
  });
}

export function findRestaurant(id, today) {
  return prisma.restaurant.findUnique({
    where: { id },
    select: {
      ...SUMMARY_SELECT(today),
      adminUsers: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
  });
}

/** Cria restaurante, primeiro administrador, assinatura e módulos em uma transação. */
export function createRestaurant({ slug, name, admin, subscription, featureRows }) {
  return prisma.restaurant.create({
    data: {
      slug,
      name,
      adminUsers: { create: admin },
      subscription: { create: subscription },
      features: { createMany: { data: featureRows } },
    },
    select: { id: true },
  });
}

export function updateRestaurant(id, data) {
  return prisma.restaurant.update({ where: { id }, data, select: { id: true } });
}

export async function replaceFeatures(restaurantId, featureRows) {
  await prisma.$transaction([
    prisma.restaurantFeature.deleteMany({ where: { restaurantId } }),
    prisma.restaurantFeature.createMany({ data: featureRows }),
  ]);
}

export function createAdmin(restaurantId, admin) {
  return prisma.adminUser.create({
    data: { ...admin, restaurantId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

/** Troca a senha e encerra as sessões abertas desse administrador. */
export async function updateAdminPassword(restaurantId, adminId, passwordHash) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.adminUser.updateMany({
      where: { id: adminId, restaurantId },
      data: { passwordHash },
    });
    if (count > 0) await tx.adminSession.deleteMany({ where: { adminUserId: adminId } });
    return count > 0;
  });
}
