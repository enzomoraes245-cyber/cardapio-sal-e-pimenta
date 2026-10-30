import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { businessToday, toIsoDate } from '../../src/shared/utils/dates.js';
import { createPlatformAdminFixture, createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
let operator;
let tenantA;
let tenantB;

beforeAll(async () => {
  operator = await createPlatformAdminFixture();
  tenantA = await createTenantFixture('fin-a');
  tenantB = await createTenantFixture('fin-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  // Eventos sem restaurante (geração de mensalidades) feitos pelo operador de teste.
  await prisma.auditEvent.deleteMany({ where: { actorId: operator.platformAdmin.id } });
  await prisma.platformAdmin.delete({ where: { id: operator.platformAdmin.id } });
  await prisma.$disconnect();
});

const asOperator = {
  get: (url) => request(app).get(`/api/v1/platform${url}`).set('Cookie', operator.cookie),
  post: (url, body, headers = {}) =>
    request(app)
      .post(`/api/v1/platform${url}`)
      .set('Cookie', operator.cookie)
      .set(headers)
      .send(body),
  put: (url, body) =>
    request(app).put(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
};

async function invoiceOf(tenant, month) {
  const response = await asOperator.get(
    `/invoices?restaurantId=${tenant.restaurant.id}&from=${month}&to=${month}`,
  );
  return response.body.data.items[0];
}

const lastAudit = (where) =>
  prisma.auditEvent.findFirst({ where, orderBy: { occurredAt: 'desc' } });

const tomorrow = () => toIsoDate(new Date(businessToday().getTime() + 24 * 60 * 60 * 1000));

describe('assinaturas e geração de mensalidades', () => {
  it('gera uma mensalidade por restaurante ativo e mês, com o valor da assinatura', async () => {
    const responses = await Promise.all([
      asOperator.put(`/restaurants/${tenantA.restaurant.id}/subscription`, {
        monthlyAmount: '120,00',
        dueDay: 10,
        startedAt: '2025-01-01',
      }),
      asOperator.put(`/restaurants/${tenantB.restaurant.id}/subscription`, {
        monthlyAmount: '80.00',
        dueDay: 20,
        startedAt: '2025-01-01',
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(responses[0].body.data).toEqual({
      monthlyAmount: '120.00',
      dueDay: 10,
      startedAt: '2025-01-01',
    });

    const first = await asOperator.post('/invoices/generate', { month: '2025-03' });
    const again = await asOperator.post('/invoices/generate', { month: '2025-03' });
    expect(first.body.data.created).toBeGreaterThanOrEqual(2);
    expect(again.body.data.created).toBe(0);

    expect(await invoiceOf(tenantA, '2025-03')).toMatchObject({
      amount: '120.00',
      dueDate: '2025-03-10',
      status: 'OPEN',
      situation: 'overdue',
      payment: null,
    });
    const generated = await lastAudit({
      action: 'INVOICES_GENERATED',
      actorId: operator.platformAdmin.id,
    });
    expect(generated.metadata).toMatchObject({ month: '2025-03' });
    expect(generated.actorName).toBe(operator.platformAdmin.name);
  });

  it('alterar a mensalidade vale só para as próximas e fica no histórico', async () => {
    const response = await asOperator.put(`/restaurants/${tenantA.restaurant.id}/subscription`, {
      monthlyAmount: '150.00',
      dueDay: 10,
      startedAt: '2025-01-01',
    });
    expect(response.status).toBe(200);

    await asOperator.post('/invoices/generate', { month: '2025-04' });
    expect((await invoiceOf(tenantA, '2025-03')).amount).toBe('120.00');
    expect((await invoiceOf(tenantA, '2025-04')).amount).toBe('150.00');

    const audit = await lastAudit({
      restaurantId: tenantA.restaurant.id,
      action: 'SUBSCRIPTION_UPDATED',
    });
    expect(audit.metadata.changes).toEqual({ monthlyAmount: { from: '120.00', to: '150.00' } });
  });

  it('valida o início da cobrança', async () => {
    const response = await asOperator.put(`/restaurants/${tenantA.restaurant.id}/subscription`, {
      monthlyAmount: '150.00',
      dueDay: 10,
      startedAt: '2025-02-30',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].path).toBe('startedAt');
  });
});

describe('pagamentos', () => {
  let invoice;
  let payment;

  beforeAll(async () => {
    invoice = await invoiceOf(tenantA, '2025-03');
  });

  it('valida data (não futura) e forma de pagamento', async () => {
    const future = await asOperator.post(`/invoices/${invoice.id}/payments`, {
      paidOn: tomorrow(),
      method: 'PIX',
    });
    const noMethod = await asOperator.post(`/invoices/${invoice.id}/payments`, {
      paidOn: '2025-03-12',
      method: 'CHEQUE',
    });

    expect(future.status).toBe(400);
    expect(future.body.error.details[0].path).toBe('paidOn');
    expect(noMethod.status).toBe(400);
    expect(noMethod.body.error.details[0].path).toBe('method');
  });

  it('registra com o valor da mensalidade e o autor; repetir não duplica', async () => {
    const key = randomUUID();
    const body = { paidOn: '2025-03-12', method: 'TRANSFER', notes: 'Comprovante 123' };
    const first = await asOperator.post(`/invoices/${invoice.id}/payments`, body, {
      'Idempotency-Key': key,
    });
    const replay = await asOperator.post(`/invoices/${invoice.id}/payments`, body, {
      'Idempotency-Key': key,
    });
    const repeated = await asOperator.post(`/invoices/${invoice.id}/payments`, body);

    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({
      status: 'PAID',
      situation: 'paid',
      payment: {
        amount: '120.00',
        paidOn: '2025-03-12',
        method: 'TRANSFER',
        notes: 'Comprovante 123',
        recordedBy: { name: operator.platformAdmin.name },
        voided: false,
      },
    });
    expect(replay.status).toBe(200);
    expect(replay.body.data.payment.id).toBe(first.body.data.payment.id);
    expect(repeated.status).toBe(409);
    expect(repeated.body.error.code).toBe('INVOICE_ALREADY_PAID');
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);

    payment = first.body.data.payment;
    const audit = await lastAudit({ entityId: payment.id, action: 'PAYMENT_RECORDED' });
    expect(audit).toMatchObject({
      restaurantId: tenantA.restaurant.id,
      actorName: operator.platformAdmin.name,
    });
  });

  it('dois registros simultâneos na mesma mensalidade: só um vale', async () => {
    const target = await invoiceOf(tenantB, '2025-04');
    const body = { paidOn: '2025-04-15', method: 'PIX' };
    const responses = await Promise.all([
      asOperator.post(`/invoices/${target.id}/payments`, body),
      asOperator.post(`/invoices/${target.id}/payments`, body),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.payment.count({ where: { invoiceId: target.id } })).toBe(1);
  });

  it('estorno exige motivo, preserva o registro e reabre a mensalidade', async () => {
    const withoutReason = await asOperator.post(`/payments/${payment.id}/void`, {});
    expect(withoutReason.status).toBe(400);

    const voided = await asOperator.post(`/payments/${payment.id}/void`, {
      reason: 'Transferência devolvida pelo banco',
    });
    expect(voided.status).toBe(200);
    expect(voided.body.data).toMatchObject({ status: 'OPEN', situation: 'overdue', payment: null });

    const again = await asOperator.post(`/payments/${payment.id}/void`, { reason: 'De novo' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('PAYMENT_ALREADY_VOIDED');

    const withVoided = await asOperator.get(
      `/payments?restaurantId=${tenantA.restaurant.id}&includeVoided=true`,
    );
    expect(withVoided.body.data).toMatchObject({ total: 1, validCount: 0, sum: '0.00' });
    expect(withVoided.body.data.items[0]).toMatchObject({
      id: payment.id,
      voided: true,
      voidReason: 'Transferência devolvida pelo banco',
      voidedBy: { name: operator.platformAdmin.name },
      invoice: { id: invoice.id, referenceMonth: '2025-03' },
    });
    const validOnly = await asOperator.get(`/payments?restaurantId=${tenantA.restaurant.id}`);
    expect(validOnly.body.data).toMatchObject({ total: 0, items: [] });

    const audit = await lastAudit({ entityId: payment.id, action: 'PAYMENT_VOIDED' });
    expect(audit.reason).toBe('Transferência devolvida pelo banco');

    // Depois do estorno, um novo pagamento pode ser registrado; o estornado continua lá.
    const newPayment = await asOperator.post(`/invoices/${invoice.id}/payments`, {
      paidOn: '2025-04-02',
      method: 'PIX',
    });
    expect(newPayment.status).toBe(201);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(2);
  });

  it('responde 404 para mensalidade ou pagamento inexistente', async () => {
    const id = randomUUID();
    const responses = await Promise.all([
      asOperator.post(`/invoices/${id}/payments`, { paidOn: '2025-04-02', method: 'PIX' }),
      asOperator.post(`/payments/${id}/void`, { reason: 'Teste' }),
      asOperator.post(`/invoices/${id}/cancel`, { reason: 'Teste' }),
      asOperator.post(`/invoices/${id}/reopen`, { reason: 'Teste' }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([404, 404, 404, 404]);
  });
});

describe('cancelamento e reabertura', () => {
  it('paga não pode ser cancelada sem estorno', async () => {
    const paid = await invoiceOf(tenantA, '2025-03');
    const response = await asOperator.post(`/invoices/${paid.id}/cancel`, { reason: 'Teste' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVOICE_PAID');
  });

  it('cancela em aberto com motivo e reabre com motivo, sem perder o histórico', async () => {
    const open = await invoiceOf(tenantB, '2025-03');

    expect((await asOperator.post(`/invoices/${open.id}/cancel`, {})).status).toBe(400);
    const canceled = await asOperator.post(`/invoices/${open.id}/cancel`, {
      reason: 'Cobrança indevida',
    });
    expect(canceled.status).toBe(200);
    expect(canceled.body.data).toMatchObject({
      status: 'CANCELED',
      situation: 'canceled',
      cancelReason: 'Cobrança indevida',
      canceledBy: { name: operator.platformAdmin.name },
    });
    expect(canceled.body.data.canceledAt).toBeTruthy();

    const cancelAgain = await asOperator.post(`/invoices/${open.id}/cancel`, { reason: 'X' });
    expect(cancelAgain.body.error.code).toBe('INVOICE_ALREADY_CANCELED');
    const payCanceled = await asOperator.post(`/invoices/${open.id}/payments`, {
      paidOn: '2025-03-20',
      method: 'CASH',
    });
    expect(payCanceled.status).toBe(409);
    expect(payCanceled.body.error.code).toBe('INVOICE_CANCELED');

    const reopened = await asOperator.post(`/invoices/${open.id}/reopen`, {
      reason: 'Cancelada por engano',
    });
    expect(reopened.status).toBe(200);
    expect(reopened.body.data).toMatchObject({
      status: 'OPEN',
      cancelReason: null,
      canceledAt: null,
    });
    const reopenAgain = await asOperator.post(`/invoices/${open.id}/reopen`, { reason: 'X' });
    expect(reopenAgain.body.error.code).toBe('INVOICE_NOT_CANCELED');

    const audit = await lastAudit({ entityId: open.id, action: 'INVOICE_REOPENED' });
    expect(audit.reason).toBe('Cancelada por engano');
    expect(audit.metadata.previousCancellation).toMatchObject({
      reason: 'Cobrança indevida',
      canceledBy: operator.platformAdmin.name,
    });
  });

  it('não existe mais a troca livre de situação', async () => {
    const invoice = await invoiceOf(tenantB, '2025-03');
    const response = await request(app)
      .patch(`/api/v1/platform/invoices/${invoice.id}`)
      .set('Cookie', operator.cookie)
      .send({ status: 'PAID' });

    expect(response.status).toBe(404);
  });
});

describe('listagens', () => {
  it('filtra por situação, competência e restaurante, com paginação e soma do filtro', async () => {
    const overdue = await asOperator.get(
      `/invoices?restaurantId=${tenantB.restaurant.id}&situation=overdue`,
    );
    // B: março reaberto (em aberto) e abril pago no teste de simultaneidade.
    expect(overdue.body.data).toMatchObject({ total: 1, sum: '80.00' });

    const all = await asOperator.get(`/invoices?restaurantId=${tenantA.restaurant.id}`);
    expect(all.body.data).toMatchObject({ total: 2, sum: '270.00', page: 1, pageSize: 25 });
    // Sem filtro de situação: competência mais recente primeiro.
    expect(all.body.data.items.map((item) => item.referenceMonth)).toEqual(['2025-04', '2025-03']);

    const secondPage = await asOperator.get(
      `/invoices?restaurantId=${tenantA.restaurant.id}&pageSize=1&page=2`,
    );
    expect(secondPage.body.data).toMatchObject({ total: 2, page: 2, pageSize: 1 });
    expect(secondPage.body.data.items.map((item) => item.referenceMonth)).toEqual(['2025-03']);

    const paid = await asOperator.get(
      `/invoices?restaurantId=${tenantA.restaurant.id}&situation=paid`,
    );
    expect(paid.body.data).toMatchObject({ total: 1, sum: '120.00' });

    const invalid = await asOperator.get('/invoices?from=2025-05&to=2025-03');
    expect(invalid.status).toBe(400);
  });

  it('distingue a vencer (vence hoje ou depois) de vencida', async () => {
    await asOperator.post('/invoices/generate', { month: '2099-01' });

    const upcoming = await asOperator.get(
      `/invoices?restaurantId=${tenantA.restaurant.id}&situation=upcoming`,
    );
    expect(upcoming.body.data.items).toEqual([
      expect.objectContaining({ referenceMonth: '2099-01', situation: 'upcoming', overdue: false }),
    ]);
  });

  it('lista pagamentos por período', async () => {
    const april = await asOperator.get(
      `/payments?restaurantId=${tenantA.restaurant.id}&from=2025-04-01&to=2025-04-30`,
    );
    expect(april.body.data).toMatchObject({ total: 1, validCount: 1, sum: '120.00' });
    expect(april.body.data.items[0]).toMatchObject({
      paidOn: '2025-04-02',
      restaurant: { id: tenantA.restaurant.id },
    });
  });
});

describe('visão geral', () => {
  it('separa valores em aberto dos pagamentos registrados no período', async () => {
    const march = await asOperator.get('/overview?from=2025-03-01&to=2025-03-31');
    const april = await asOperator.get('/overview?from=2025-04-01&to=2025-04-30');

    expect(march.status).toBe(200);
    // Em março só há o pagamento estornado: estornos nunca contam como recebidos.
    expect(march.body.data.payments).toEqual({ count: 0, amount: '0.00' });
    expect(april.body.data.payments).toEqual({ count: 2, amount: '200.00' });
    expect(april.body.data.period).toEqual({ from: '2025-04-01', to: '2025-04-30' });

    const [active, suspended] = await Promise.all([
      prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      prisma.restaurant.count({ where: { status: 'SUSPENDED' } }),
    ]);
    expect(march.body.data.restaurants).toEqual({ total: active + suspended, active, suspended });
  });

  it('cancelar uma vencida tira o valor das vencidas sem mexer nos recebidos', async () => {
    const before = (await asOperator.get('/overview?from=2025-04-01&to=2025-04-30')).body.data;
    const target = await invoiceOf(tenantB, '2025-03');
    await asOperator.post(`/invoices/${target.id}/cancel`, { reason: 'Teste da visão geral' });
    const after = (await asOperator.get('/overview?from=2025-04-01&to=2025-04-30')).body.data;

    expect(after.overdue.count).toBe(before.overdue.count - 1);
    expect(Number(after.overdue.amount)).toBeCloseTo(Number(before.overdue.amount) - 80, 2);
    expect(after.upcoming).toEqual(before.upcoming);
    expect(after.payments).toEqual(before.payments);
  });

  it('sem período usa o mês atual e exige as duas datas quando informado', async () => {
    const today = businessToday();
    const current = await asOperator.get('/overview');
    const partial = await asOperator.get('/overview?from=2025-04-01');

    expect(current.body.data.today).toBe(toIsoDate(today));
    expect(current.body.data.period.from).toBe(`${toIsoDate(today).slice(0, 7)}-01`);
    expect(partial.status).toBe(400);
  });
});

describe('preservação do histórico financeiro', () => {
  it('o banco não permite apagar restaurante com mensalidades e pagamentos', async () => {
    await expect(
      prisma.restaurant.delete({ where: { id: tenantA.restaurant.id } }),
    ).rejects.toThrow();
    expect(await prisma.restaurant.count({ where: { id: tenantA.restaurant.id } })).toBe(1);
  });

  it('exige sessão de operador', async () => {
    const asRestaurant = await request(app)
      .get('/api/v1/platform/invoices')
      .set('Cookie', tenantA.cookie);
    expect(asRestaurant.status).toBe(401);
  });
});
