import { prisma } from '../../../config/database.js';

const INVOICE_SELECT = {
  id: true,
  referenceMonth: true,
  amount: true,
  dueDate: true,
  status: true,
  paidAt: true,
  restaurant: { select: { id: true, name: true, slug: true, status: true } },
};

export function upsertSubscription(restaurantId, { monthlyAmount, dueDay }, startedAt) {
  return prisma.subscription.upsert({
    where: { restaurantId },
    update: { monthlyAmount, dueDay },
    create: { restaurantId, monthlyAmount, dueDay, startedAt },
  });
}

export function listInvoices({ status, overdue, referenceMonth, restaurantId, today }) {
  return prisma.invoice.findMany({
    where: {
      ...(restaurantId && { restaurantId }),
      ...(referenceMonth && { referenceMonth }),
      ...(overdue ? { status: 'OPEN', dueDate: { lt: today } } : status && { status }),
    },
    orderBy: [{ referenceMonth: 'desc' }, { restaurant: { name: 'asc' } }],
    take: 500,
    select: INVOICE_SELECT,
  });
}

/** Assinaturas de restaurantes ativos iniciadas até o fim do mês informado. */
export function listBillableSubscriptions(lastDayOfMonth) {
  return prisma.subscription.findMany({
    where: { startedAt: { lte: lastDayOfMonth }, restaurant: { status: 'ACTIVE' } },
    select: { restaurantId: true, monthlyAmount: true, dueDay: true },
  });
}

/** Ignora restaurantes que já têm fatura no mês (idempotente). Retorna quantas foram criadas. */
export async function createInvoices(rows) {
  const { count } = await prisma.invoice.createMany({ data: rows, skipDuplicates: true });
  return count;
}

export async function updateInvoiceStatus(id, data) {
  const { count } = await prisma.invoice.updateMany({ where: { id }, data });
  return count === 0 ? null : prisma.invoice.findUnique({ where: { id }, select: INVOICE_SELECT });
}
