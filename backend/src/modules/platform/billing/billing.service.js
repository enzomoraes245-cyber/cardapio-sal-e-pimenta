import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { parseIsoMonth, toIsoDate, toIsoMonth, todayUtc } from '../../../shared/utils/dates.js';
import * as billingRepository from './billing.repository.js';

/**
 * Cobrança manual das mensalidades (DEC-006, item 2): faturas mensais com baixa manual.
 * Não há gateway de pagamento. "Vencida" é calculada: OPEN com vencimento no passado.
 */

function toInvoice(invoice, today = todayUtc()) {
  return {
    id: invoice.id,
    restaurant: invoice.restaurant,
    referenceMonth: toIsoMonth(invoice.referenceMonth),
    amount: invoice.amount.toFixed(2),
    dueDate: toIsoDate(invoice.dueDate),
    status: invoice.status,
    paidAt: invoice.paidAt,
    overdue: invoice.status === 'OPEN' && invoice.dueDate < today,
  };
}

export async function updateSubscription(restaurantId, data) {
  try {
    const subscription = await billingRepository.upsertSubscription(restaurantId, data, todayUtc());
    return {
      monthlyAmount: subscription.monthlyAmount.toFixed(2),
      dueDay: subscription.dueDay,
      startedAt: toIsoDate(subscription.startedAt),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new NotFoundError('Restaurante não encontrado.');
    }
    throw error;
  }
}

export async function listInvoices({ status, overdue, month, restaurantId }) {
  const today = todayUtc();
  const invoices = await billingRepository.listInvoices({
    status,
    overdue,
    restaurantId,
    referenceMonth: month ? parseIsoMonth(month) : undefined,
    today,
  });
  return invoices.map((invoice) => toInvoice(invoice, today));
}

/** Gera as faturas do mês para os restaurantes ativos. Pode ser executada mais de uma vez. */
export async function generateMonthlyInvoices(month) {
  const referenceMonth = parseIsoMonth(month);
  const year = referenceMonth.getUTCFullYear();
  const monthIndex = referenceMonth.getUTCMonth();
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));

  const subscriptions = await billingRepository.listBillableSubscriptions(lastDayOfMonth);
  const created = await billingRepository.createInvoices(
    subscriptions.map((subscription) => ({
      restaurantId: subscription.restaurantId,
      referenceMonth,
      amount: subscription.monthlyAmount,
      dueDate: new Date(Date.UTC(year, monthIndex, subscription.dueDay)),
    })),
  );
  return { month, created, billable: subscriptions.length };
}

export async function updateInvoiceStatus(id, { status }) {
  const invoice = await billingRepository.updateInvoiceStatus(id, {
    status,
    paidAt: status === 'PAID' ? new Date() : null,
  });
  if (!invoice) throw new NotFoundError('Fatura não encontrada.');
  return toInvoice(invoice);
}
