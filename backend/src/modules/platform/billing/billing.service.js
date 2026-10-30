import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/app-error.js';
import { changedFields } from '../../../shared/utils/changes.js';
import {
  businessToday,
  parseIsoDate,
  parseIsoMonth,
  toIsoDate,
  toIsoMonth,
} from '../../../shared/utils/dates.js';
import { createOnce } from '../../../shared/utils/idempotency.js';
import { AUDIT_ACTIONS } from '../../audit/audit.actions.js';
import { recordAuditEvent } from '../../audit/audit.repository.js';
import * as billingRepository from './billing.repository.js';

/**
 * Cobrança manual das mensalidades (DEC-006, item 2), sem gateway de pagamento. Pagamentos,
 * estornos e cancelamentos são registros com autor, data e motivo; nada é apagado.
 * "Vencida" é calculada: em aberto com vencimento anterior a hoje, no fuso do negócio.
 */

const ZERO = new Prisma.Decimal(0);
const money = (value) => (value ?? ZERO).toFixed(2);
const person = (name) => (name ? { name } : null);

function toPayment(payment) {
  if (!payment) return null;
  return {
    id: payment.id,
    amount: money(payment.amount),
    paidOn: toIsoDate(payment.paidOn),
    method: payment.method,
    notes: payment.notes,
    recordedBy: person(payment.recordedByName),
    recordedAt: payment.recordedAt,
    voided: Boolean(payment.voidedAt),
    voidedAt: payment.voidedAt,
    voidedBy: person(payment.voidedByName),
    voidReason: payment.voidReason,
  };
}

/** Situação exibida: paga, cancelada, vencida (antes de hoje) ou a vencer (hoje ou depois). */
export function invoiceSituation(invoice, today) {
  if (invoice.status === 'PAID') return 'paid';
  if (invoice.status === 'CANCELED') return 'canceled';
  return invoice.dueDate < today ? 'overdue' : 'upcoming';
}

function toInvoice(invoice, today = businessToday()) {
  const situation = invoiceSituation(invoice, today);
  return {
    id: invoice.id,
    restaurant: invoice.restaurant,
    referenceMonth: toIsoMonth(invoice.referenceMonth),
    amount: money(invoice.amount),
    dueDate: toIsoDate(invoice.dueDate),
    status: invoice.status,
    situation,
    overdue: situation === 'overdue',
    payment: toPayment(invoice.payments[0]),
    canceledAt: invoice.canceledAt,
    canceledBy: person(invoice.canceledByName),
    cancelReason: invoice.cancelReason,
  };
}

function toSubscription(subscription) {
  return {
    monthlyAmount: money(subscription.monthlyAmount),
    dueDay: subscription.dueDay,
    startedAt: toIsoDate(subscription.startedAt),
  };
}

const pageOf = ({ page, pageSize }) => ({ skip: (page - 1) * pageSize, take: pageSize });

async function loadInvoice(id) {
  const invoice = await billingRepository.findInvoice(id);
  if (!invoice) throw new NotFoundError('Mensalidade não encontrada.');
  return toInvoice(invoice);
}

/** Erro coerente com a situação atual da fatura quando a transição pedida não é possível. */
function invoiceConflict(status, operation) {
  const messages = {
    pay: {
      PAID: ['Esta mensalidade já tem um pagamento registrado.', 'INVOICE_ALREADY_PAID'],
      CANCELED: [
        'Mensalidade cancelada: reabra antes de registrar o pagamento.',
        'INVOICE_CANCELED',
      ],
    },
    cancel: {
      PAID: ['Mensalidade paga não pode ser cancelada: estorne o pagamento antes.', 'INVOICE_PAID'],
      CANCELED: ['Esta mensalidade já está cancelada.', 'INVOICE_ALREADY_CANCELED'],
    },
    reopen: {
      OPEN: ['Só mensalidades canceladas podem ser reabertas.', 'INVOICE_NOT_CANCELED'],
      PAID: ['Só mensalidades canceladas podem ser reabertas.', 'INVOICE_NOT_CANCELED'],
    },
  };
  const [message, code] = messages[operation]?.[status] ?? [
    'A mensalidade mudou de situação. Atualize a página e tente novamente.',
    'INVOICE_STATE_CHANGED',
  ];
  return new ConflictError(message, code);
}

/** Lê a fatura na transação ou responde 404. */
async function requireInvoice(tx, id) {
  const invoice = await billingRepository.findInvoiceState(tx, id);
  if (!invoice) throw new NotFoundError('Mensalidade não encontrada.');
  return invoice;
}

/**
 * Mensalidade, dia de vencimento e início da cobrança. Vale para as próximas faturas geradas:
 * as já existentes mantêm o valor copiado na geração.
 */
export async function updateSubscription(restaurantId, data, actor) {
  try {
    const subscription = await prisma.$transaction(async (tx) => {
      const current = await billingRepository.findSubscription(tx, restaurantId);
      const startedAt = data.startedAt
        ? parseIsoDate(data.startedAt)
        : (current?.startedAt ?? businessToday());
      const updated = await billingRepository.upsertSubscription(tx, restaurantId, {
        monthlyAmount: data.monthlyAmount,
        dueDay: data.dueDay,
        startedAt,
      });
      const changes = changedFields(
        current ? toSubscription(current) : {},
        toSubscription(updated),
      );
      if (Object.keys(changes).length > 0) {
        await recordAuditEvent(tx, {
          actor,
          restaurantId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
          entityType: 'subscription',
          entityId: restaurantId,
          metadata: { changes },
        });
      }
      return updated;
    });
    return toSubscription(subscription);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new NotFoundError('Restaurante não encontrado.');
    }
    throw error;
  }
}

export async function listInvoices({ restaurantId, situation, from, to, page, pageSize }) {
  const today = businessToday();
  const { items, total, sum } = await billingRepository.listInvoices({
    restaurantId,
    situation,
    fromMonth: from ? parseIsoMonth(from) : undefined,
    toMonth: to ? parseIsoMonth(to) : undefined,
    today,
    ...pageOf({ page, pageSize }),
  });
  return {
    items: items.map((invoice) => toInvoice(invoice, today)),
    total,
    page,
    pageSize,
    sum: money(sum),
  };
}

/** Gera as faturas do mês para os restaurantes ativos. Pode ser executada mais de uma vez. */
export async function generateMonthlyInvoices(month, actor) {
  const referenceMonth = parseIsoMonth(month);
  const year = referenceMonth.getUTCFullYear();
  const monthIndex = referenceMonth.getUTCMonth();
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));

  return prisma.$transaction(async (tx) => {
    const subscriptions = await billingRepository.listBillableSubscriptions(tx, lastDayOfMonth);
    const created = await billingRepository.createInvoices(
      tx,
      subscriptions.map((subscription) => ({
        restaurantId: subscription.restaurantId,
        referenceMonth,
        amount: subscription.monthlyAmount,
        dueDate: new Date(Date.UTC(year, monthIndex, subscription.dueDay)),
      })),
    );
    if (created > 0) {
      await recordAuditEvent(tx, {
        actor,
        action: AUDIT_ACTIONS.INVOICES_GENERATED,
        entityType: 'invoice',
        metadata: { month, created, billable: subscriptions.length },
      });
    }
    return { month, created, billable: subscriptions.length };
  });
}

/**
 * Registra o pagamento de uma mensalidade em aberto (valor = valor da mensalidade). Com a mesma
 * Idempotency-Key, o envio repetido devolve o registro já feito; sem ela, repetir responde 409.
 */
export async function recordPayment(invoiceId, data, { actor, idempotencyKey }) {
  if (parseIsoDate(data.paidOn) > businessToday()) {
    throw new ValidationError([
      { source: 'body', path: 'paidOn', message: 'A data do pagamento não pode ser futura.' },
    ]);
  }

  const { result, replayed } = await createOnce(
    { key: idempotencyKey, scope: 'platform.payment.record', ownerId: actor.id },
    {
      create: async (tx) => {
        const invoice = await requireInvoice(tx, invoiceId);
        const now = new Date();
        if (!(await billingRepository.markInvoicePaid(tx, invoiceId, now))) {
          const current = await billingRepository.findInvoiceState(tx, invoiceId);
          throw invoiceConflict(current.status, 'pay');
        }
        const payment = await billingRepository.createPayment(tx, {
          invoiceId,
          restaurantId: invoice.restaurantId,
          activeInvoiceId: invoiceId,
          amount: invoice.amount,
          paidOn: parseIsoDate(data.paidOn),
          method: data.method,
          notes: data.notes ?? null,
          recordedById: actor.id,
          recordedByName: actor.name,
          recordedAt: now,
        });
        await recordAuditEvent(tx, {
          actor,
          restaurantId: invoice.restaurantId,
          action: AUDIT_ACTIONS.PAYMENT_RECORDED,
          entityType: 'payment',
          entityId: payment.id,
          metadata: {
            invoiceId,
            referenceMonth: toIsoMonth(invoice.referenceMonth),
            amount: money(invoice.amount),
            paidOn: data.paidOn,
            method: data.method,
          },
        });
        return payment;
      },
      load: async (paymentId) => {
        const payment = await billingRepository.findPaymentInvoiceId(paymentId);
        return loadInvoice(payment.invoiceId);
      },
    },
  );
  return { invoice: result, replayed };
}

/** Estorna um pagamento (com motivo): o registro é mantido e a mensalidade volta a ficar em aberto. */
export async function voidPayment(paymentId, { reason }, actor) {
  const invoiceId = await prisma.$transaction(async (tx) => {
    const payment = await billingRepository.findPaymentState(tx, paymentId);
    if (!payment) throw new NotFoundError('Pagamento não encontrado.');
    const voided = await billingRepository.voidPayment(tx, paymentId, {
      voidedAt: new Date(),
      actor,
      reason,
    });
    if (!voided)
      throw new ConflictError('Este pagamento já foi estornado.', 'PAYMENT_ALREADY_VOIDED');
    if (!(await billingRepository.reopenPaidInvoice(tx, payment.invoiceId))) {
      throw invoiceConflict(null, 'void');
    }
    await recordAuditEvent(tx, {
      actor,
      restaurantId: payment.restaurantId,
      action: AUDIT_ACTIONS.PAYMENT_VOIDED,
      entityType: 'payment',
      entityId: paymentId,
      reason,
      metadata: {
        invoiceId: payment.invoiceId,
        referenceMonth: toIsoMonth(payment.invoice.referenceMonth),
        amount: money(payment.amount),
        paidOn: toIsoDate(payment.paidOn),
        method: payment.method,
      },
    });
    return payment.invoiceId;
  });
  return loadInvoice(invoiceId);
}

/** Cancela uma mensalidade em aberto, com motivo. Paga exige estorno antes. */
export async function cancelInvoice(invoiceId, { reason }, actor) {
  await prisma.$transaction(async (tx) => {
    const invoice = await requireInvoice(tx, invoiceId);
    const canceled = await billingRepository.cancelInvoice(tx, invoiceId, {
      canceledAt: new Date(),
      actor,
      reason,
    });
    if (!canceled) {
      const current = await billingRepository.findInvoiceState(tx, invoiceId);
      throw invoiceConflict(current.status, 'cancel');
    }
    await recordAuditEvent(tx, {
      actor,
      restaurantId: invoice.restaurantId,
      action: AUDIT_ACTIONS.INVOICE_CANCELED,
      entityType: 'invoice',
      entityId: invoiceId,
      reason,
      metadata: {
        referenceMonth: toIsoMonth(invoice.referenceMonth),
        amount: money(invoice.amount),
      },
    });
  });
  return loadInvoice(invoiceId);
}

/** Reabre uma mensalidade cancelada, com motivo. O cancelamento anterior fica no histórico. */
export async function reopenInvoice(invoiceId, { reason }, actor) {
  await prisma.$transaction(async (tx) => {
    const invoice = await requireInvoice(tx, invoiceId);
    if (!(await billingRepository.reopenCanceledInvoice(tx, invoiceId))) {
      const current = await billingRepository.findInvoiceState(tx, invoiceId);
      throw invoiceConflict(current.status, 'reopen');
    }
    await recordAuditEvent(tx, {
      actor,
      restaurantId: invoice.restaurantId,
      action: AUDIT_ACTIONS.INVOICE_REOPENED,
      entityType: 'invoice',
      entityId: invoiceId,
      reason,
      metadata: {
        referenceMonth: toIsoMonth(invoice.referenceMonth),
        amount: money(invoice.amount),
        previousCancellation: {
          canceledAt: invoice.canceledAt,
          canceledBy: invoice.canceledByName,
          reason: invoice.cancelReason,
        },
      },
    });
  });
  return loadInvoice(invoiceId);
}

export async function listPayments({ restaurantId, from, to, includeVoided, page, pageSize }) {
  const { items, total, validCount, sum } = await billingRepository.listPayments({
    restaurantId,
    fromDate: from ? parseIsoDate(from) : undefined,
    toDate: to ? parseIsoDate(to) : undefined,
    includeVoided,
    ...pageOf({ page, pageSize }),
  });
  return {
    items: items.map(({ invoice, restaurant, ...payment }) => ({
      ...toPayment(payment),
      invoice: {
        id: invoice.id,
        referenceMonth: toIsoMonth(invoice.referenceMonth),
        dueDate: toIsoDate(invoice.dueDate),
      },
      restaurant,
    })),
    total,
    page,
    pageSize,
    validCount,
    sum: money(sum),
  };
}

/** Primeiro e último dia do mês de uma data. */
function monthRange(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return { from: new Date(Date.UTC(year, month, 1)), to: new Date(Date.UTC(year, month + 1, 0)) };
}

/**
 * Indicadores da plataforma com critérios explícitos: valores em aberto (a vencer e vencidos)
 * nunca são somados aos pagamentos registrados.
 */
export async function getOverview({ from, to }) {
  const today = businessToday();
  const period = from ? { from: parseIsoDate(from), to: parseIsoDate(to) } : monthRange(today);
  const data = await billingRepository.overview({ ...period, today });
  const countOf = (status) =>
    data.restaurants.find((row) => row.status === status)?._count._all ?? 0;
  const active = countOf('ACTIVE');
  const suspended = countOf('SUSPENDED');
  return {
    today: toIsoDate(today),
    period: { from: toIsoDate(period.from), to: toIsoDate(period.to) },
    restaurants: { total: active + suspended, active, suspended },
    upcoming: { count: data.upcoming._count._all, amount: money(data.upcoming._sum.amount) },
    overdue: {
      count: data.overdue._count._all,
      amount: money(data.overdue._sum.amount),
      restaurants: data.overdueRestaurants,
    },
    payments: { count: data.payments._count._all, amount: money(data.payments._sum.amount) },
  };
}
