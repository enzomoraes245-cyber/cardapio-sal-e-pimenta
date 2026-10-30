import { prisma } from '../../../config/database.js';

const PAYMENT_SELECT = {
  id: true,
  amount: true,
  paidOn: true,
  method: true,
  notes: true,
  recordedByName: true,
  recordedAt: true,
  voidedAt: true,
  voidedByName: true,
  voidReason: true,
};

const INVOICE_SELECT = {
  id: true,
  referenceMonth: true,
  amount: true,
  dueDate: true,
  status: true,
  canceledAt: true,
  canceledByName: true,
  cancelReason: true,
  restaurant: { select: { id: true, name: true, slug: true, status: true } },
  // No máximo um pagamento válido por fatura (índice único em active_invoice_id).
  payments: { where: { voidedAt: null }, select: PAYMENT_SELECT, take: 1 },
};

const PAYMENT_LIST_SELECT = {
  ...PAYMENT_SELECT,
  invoice: { select: { id: true, referenceMonth: true, dueDate: true } },
  restaurant: { select: { id: true, name: true, slug: true } },
};

/** Situação → filtro. Em aberto vence "hoje ou depois" (a vencer) ou "antes de hoje" (vencida). */
function situationWhere(situation, today) {
  switch (situation) {
    case 'open':
      return { status: 'OPEN' };
    case 'upcoming':
      return { status: 'OPEN', dueDate: { gte: today } };
    case 'overdue':
      return { status: 'OPEN', dueDate: { lt: today } };
    case 'paid':
      return { status: 'PAID' };
    case 'canceled':
      return { status: 'CANCELED' };
    default:
      return {};
  }
}

function rangeWhere(from, to) {
  if (!from && !to) return undefined;
  return { ...(from && { gte: from }), ...(to && { lte: to }) };
}

export function findSubscription(client, restaurantId) {
  return client.subscription.findUnique({ where: { restaurantId } });
}

export function upsertSubscription(client, restaurantId, data) {
  return client.subscription.upsert({
    where: { restaurantId },
    update: data,
    create: { restaurantId, ...data },
  });
}

/**
 * Mensalidades filtradas e paginadas, com total e soma dos valores de todo o filtro. As em aberto
 * vêm por vencimento (as mais antigas primeiro); as demais, da competência mais recente.
 */
export async function listInvoices({
  restaurantId,
  situation,
  fromMonth,
  toMonth,
  today,
  skip,
  take,
}) {
  const where = {
    ...(restaurantId && { restaurantId }),
    ...(rangeWhere(fromMonth, toMonth) && { referenceMonth: rangeWhere(fromMonth, toMonth) }),
    ...situationWhere(situation, today),
  };
  const byDueDate = ['open', 'upcoming', 'overdue'].includes(situation);
  const orderBy = [
    byDueDate ? { dueDate: 'asc' } : { referenceMonth: 'desc' },
    { restaurant: { name: 'asc' } },
    { id: 'asc' },
  ];
  const [items, totals] = await prisma.$transaction([
    prisma.invoice.findMany({ where, orderBy, skip, take, select: INVOICE_SELECT }),
    prisma.invoice.aggregate({ where, _count: { _all: true }, _sum: { amount: true } }),
  ]);
  return { items, total: totals._count._all, sum: totals._sum.amount };
}

export function findInvoice(id, client = prisma) {
  return client.invoice.findUnique({ where: { id }, select: INVOICE_SELECT });
}

/** Estado atual da fatura, dentro da transação da operação. */
export function findInvoiceState(tx, id) {
  return tx.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      restaurantId: true,
      status: true,
      amount: true,
      referenceMonth: true,
      canceledAt: true,
      canceledByName: true,
      cancelReason: true,
    },
  });
}

/** Assinaturas de restaurantes ativos iniciadas até o fim do mês informado. */
export function listBillableSubscriptions(tx, lastDayOfMonth) {
  return tx.subscription.findMany({
    where: { startedAt: { lte: lastDayOfMonth }, restaurant: { status: 'ACTIVE' } },
    select: { restaurantId: true, monthlyAmount: true, dueDay: true },
  });
}

/** Ignora restaurantes que já têm fatura no mês (idempotente). Retorna quantas foram criadas. */
export async function createInvoices(tx, rows) {
  const { count } = await tx.invoice.createMany({ data: rows, skipDuplicates: true });
  return count;
}

// Transições: cada uma só acontece a partir da situação esperada (atualização condicional), então
// duas operações simultâneas na mesma fatura não se sobrepõem. Retornam false se nada mudou.

export async function markInvoicePaid(tx, id, paidAt) {
  const { count } = await tx.invoice.updateMany({
    where: { id, status: 'OPEN' },
    data: { status: 'PAID', paidAt },
  });
  return count === 1;
}

export async function reopenPaidInvoice(tx, id) {
  const { count } = await tx.invoice.updateMany({
    where: { id, status: 'PAID' },
    data: { status: 'OPEN', paidAt: null },
  });
  return count === 1;
}

export async function cancelInvoice(tx, id, { canceledAt, actor, reason }) {
  const { count } = await tx.invoice.updateMany({
    where: { id, status: 'OPEN' },
    data: {
      status: 'CANCELED',
      canceledAt,
      canceledById: actor.id ?? null,
      canceledByName: actor.name ?? null,
      cancelReason: reason,
    },
  });
  return count === 1;
}

export async function reopenCanceledInvoice(tx, id) {
  const { count } = await tx.invoice.updateMany({
    where: { id, status: 'CANCELED' },
    data: {
      status: 'OPEN',
      canceledAt: null,
      canceledById: null,
      canceledByName: null,
      cancelReason: null,
    },
  });
  return count === 1;
}

export function createPayment(tx, data) {
  return tx.payment.create({ data, select: { id: true } });
}

export function findPaymentState(tx, id) {
  return tx.payment.findUnique({
    where: { id },
    select: {
      id: true,
      invoiceId: true,
      restaurantId: true,
      amount: true,
      paidOn: true,
      method: true,
      voidedAt: true,
      invoice: { select: { referenceMonth: true } },
    },
  });
}

export function findPaymentInvoiceId(id) {
  return prisma.payment.findUnique({ where: { id }, select: { invoiceId: true } });
}

export async function voidPayment(tx, id, { voidedAt, actor, reason }) {
  const { count } = await tx.payment.updateMany({
    where: { id, voidedAt: null },
    data: {
      activeInvoiceId: null,
      voidedAt,
      voidedById: actor.id ?? null,
      voidedByName: actor.name ?? null,
      voidReason: reason,
    },
  });
  return count === 1;
}

/**
 * Pagamentos filtrados e paginados. Total e soma consideram só os válidos (estornados nunca
 * contam como recebidos), mesmo quando a lista inclui os estornados.
 */
export async function listPayments({ restaurantId, fromDate, toDate, includeVoided, skip, take }) {
  const base = {
    ...(restaurantId && { restaurantId }),
    ...(rangeWhere(fromDate, toDate) && { paidOn: rangeWhere(fromDate, toDate) }),
  };
  const where = includeVoided ? base : { ...base, voidedAt: null };
  const [items, total, valid] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: [{ paidOn: 'desc' }, { recordedAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: PAYMENT_LIST_SELECT,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { ...base, voidedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);
  return { items, total, validCount: valid._count._all, sum: valid._sum.amount };
}

/** Números da visão geral, numa única leitura. */
export async function overview({ from, to, today }) {
  const overdueWhere = { status: 'OPEN', dueDate: { lt: today } };
  const [restaurants, upcoming, overdue, overdueRestaurants, payments] = await prisma.$transaction([
    prisma.restaurant.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'OPEN', dueDate: { gte: today } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: overdueWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.invoice.groupBy({
      by: ['restaurantId'],
      where: overdueWhere,
      orderBy: { restaurantId: 'asc' },
    }),
    prisma.payment.aggregate({
      where: { voidedAt: null, paidOn: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);
  return {
    restaurants,
    upcoming,
    overdue,
    overdueRestaurants: overdueRestaurants.length,
    payments,
  };
}
