import { prisma } from '../../../config/database.js';

const ADMIN_SELECT = { id: true, name: true, email: true, disabledAt: true, createdAt: true };

const RESTAURANT_SELECT = {
  id: true,
  slug: true,
  name: true,
  status: true,
  suspendedAt: true,
  suspensionReason: true,
  contactPhone: true,
  contactEmail: true,
  createdAt: true,
  subscription: { select: { monthlyAmount: true, dueDay: true, startedAt: true } },
  features: { select: { feature: true, enabled: true } },
};

/** Lista com o primeiro responsável cadastrado (contato principal do restaurante). */
export function listRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { name: 'asc' },
    select: {
      ...RESTAURANT_SELECT,
      adminUsers: { orderBy: { createdAt: 'asc' }, take: 1, select: ADMIN_SELECT },
      _count: { select: { adminUsers: true } },
    },
  });
}

export function findRestaurant(id, client = prisma) {
  return client.restaurant.findUnique({
    where: { id },
    select: {
      ...RESTAURANT_SELECT,
      adminUsers: { orderBy: { createdAt: 'asc' }, select: ADMIN_SELECT },
      _count: { select: { adminUsers: true } },
    },
  });
}

/** Mensalidades em aberto e vencidas (vencimento anterior a `today`), por restaurante. */
export function overdueInvoicesByRestaurant(today, restaurantId) {
  return prisma.invoice.groupBy({
    by: ['restaurantId'],
    where: { status: 'OPEN', dueDate: { lt: today }, ...(restaurantId && { restaurantId }) },
    _count: { _all: true },
    _sum: { amount: true },
  });
}

/** Cria restaurante, primeiro administrador, assinatura e módulos (na transação recebida). */
export function createRestaurant(tx, { slug, name, contact, admin, subscription, featureRows }) {
  return tx.restaurant.create({
    data: {
      slug,
      name,
      ...contact,
      adminUsers: { create: admin },
      subscription: { create: subscription },
      features: { createMany: { data: featureRows } },
    },
    select: { id: true, adminUsers: { select: { id: true } } },
  });
}

export function updateRestaurant(tx, id, data) {
  return tx.restaurant.update({ where: { id }, data, select: { id: true } });
}

/** Muda a situação só a partir do estado esperado (evita suspender duas vezes). */
export async function changeStatus(tx, id, { from, data }) {
  const { count } = await tx.restaurant.updateMany({ where: { id, status: from }, data });
  return count > 0;
}

export async function replaceFeatures(tx, restaurantId, featureRows) {
  await tx.restaurantFeature.deleteMany({ where: { restaurantId } });
  await tx.restaurantFeature.createMany({ data: featureRows });
}

export function findAdmin(restaurantId, adminId, client = prisma) {
  return client.adminUser.findFirst({
    where: { id: adminId, restaurantId },
    select: ADMIN_SELECT,
  });
}

export function createAdmin(tx, restaurantId, admin) {
  return tx.adminUser.create({ data: { ...admin, restaurantId }, select: ADMIN_SELECT });
}

export function updateAdmin(tx, adminId, data) {
  return tx.adminUser.update({ where: { id: adminId }, data, select: ADMIN_SELECT });
}

/** Bloqueia o acesso (só se estiver liberado) e encerra as sessões abertas. */
export async function blockAdmin(tx, restaurantId, adminId, now) {
  const { count } = await tx.adminUser.updateMany({
    where: { id: adminId, restaurantId, disabledAt: null },
    data: { disabledAt: now },
  });
  if (count > 0) await tx.adminSession.deleteMany({ where: { adminUserId: adminId } });
  return count > 0;
}

/** Libera o acesso (só se estiver bloqueado). */
export async function unblockAdmin(tx, restaurantId, adminId) {
  const { count } = await tx.adminUser.updateMany({
    where: { id: adminId, restaurantId, disabledAt: { not: null } },
    data: { disabledAt: null },
  });
  return count > 0;
}

/** Troca a senha e encerra as sessões abertas desse administrador. */
export async function updateAdminPassword(tx, adminId, passwordHash) {
  await tx.adminUser.update({ where: { id: adminId }, data: { passwordHash } });
  await tx.adminSession.deleteMany({ where: { adminUserId: adminId } });
}
