import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { createPlatformAdminFixture, createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
const ADMIN_PASSWORD = 'senha-do-restaurante-1';
let operator;
let tenant;
const createdRestaurantIds = [];

beforeAll(async () => {
  operator = await createPlatformAdminFixture();
  tenant = await createTenantFixture('gestao');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenant.restaurant.id, ...createdRestaurantIds]);
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
  patch: (url, body) =>
    request(app).patch(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
  put: (url, body) =>
    request(app).put(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
};

function newRestaurantBody(overrides = {}) {
  const suffix = randomUUID().slice(0, 8);
  return {
    slug: `gestao-${suffix}`,
    name: `Gestão ${suffix}`,
    contactPhone: '(11) 98765-4321',
    contactEmail: `Contato-${suffix}@Teste.local`,
    admin: { name: 'Dona', email: `dona-${suffix}@teste.local`, password: ADMIN_PASSWORD },
    subscription: { monthlyAmount: '119,90', dueDay: 12, startedAt: '2026-11-01' },
    ...overrides,
  };
}

const history = (restaurantId) =>
  asOperator.get(`/audit-events?restaurantId=${restaurantId}&pageSize=50`);

describe('cadastro com contato e idempotência', () => {
  it('grava contato (e-mail em minúsculas), início da assinatura e histórico', async () => {
    const body = newRestaurantBody();
    const response = await asOperator.post('/restaurants', body);

    expect(response.status).toBe(201);
    const restaurant = response.body.data;
    createdRestaurantIds.push(restaurant.id);
    expect(restaurant).toMatchObject({
      contactPhone: '(11) 98765-4321',
      contactEmail: body.contactEmail.toLowerCase(),
      subscription: { monthlyAmount: '119.90', dueDay: 12, startedAt: '2026-11-01' },
      overdueInvoices: 0,
      overdueAmount: '0.00',
    });

    const events = (await history(restaurant.id)).body.data.items.map((event) => event.action);
    expect(events).toEqual(expect.arrayContaining(['RESTAURANT_CREATED', 'ADMIN_CREATED']));
  });

  it('com a mesma Idempotency-Key, o envio repetido não duplica o restaurante', async () => {
    const body = newRestaurantBody();
    const key = randomUUID();
    const [first, second] = await Promise.all([
      asOperator.post('/restaurants', body, { 'Idempotency-Key': key }),
      asOperator.post('/restaurants', body, { 'Idempotency-Key': key }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 201]);
    expect(first.body.data.id).toBe(second.body.data.id);
    createdRestaurantIds.push(first.body.data.id);
    expect(await prisma.restaurant.count({ where: { slug: body.slug } })).toBe(1);

    // Mais tarde, a mesma chave continua devolvendo o mesmo cadastro.
    const later = await asOperator.post('/restaurants', body, { 'Idempotency-Key': key });
    expect(later.status).toBe(200);
    expect(later.body.data.id).toBe(first.body.data.id);
  });

  it('recusa chave de idempotência malformada e telefone inválido', async () => {
    const badKey = await asOperator.post('/restaurants', newRestaurantBody(), {
      'Idempotency-Key': 'curta',
    });
    expect(badKey.status).toBe(400);

    const badPhone = await asOperator.post(
      '/restaurants',
      newRestaurantBody({ contactPhone: '123' }),
    );
    expect(badPhone.status).toBe(400);
    expect(badPhone.body.error.details[0].path).toBe('contactPhone');
  });
});

describe('dados cadastrais', () => {
  it('altera nome e contato, registra antes/depois e nunca muda o slug', async () => {
    const response = await asOperator.patch(`/restaurants/${tenant.restaurant.id}`, {
      name: 'Gestão Renomeado',
      contactPhone: '(21) 3333-4444',
      contactEmail: '',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: 'Gestão Renomeado',
      slug: tenant.restaurant.slug,
      contactPhone: '(21) 3333-4444',
      contactEmail: null,
    });

    const [event] = (await history(tenant.restaurant.id)).body.data.items.filter(
      (item) => item.action === 'RESTAURANT_UPDATED',
    );
    expect(event.actor).toEqual({ type: 'PLATFORM_ADMIN', name: 'Operador de teste' });
    expect(event.metadata.changes.name).toEqual({
      from: tenant.restaurant.name,
      to: 'Gestão Renomeado',
    });
  });
});

describe('suspensão e reativação com motivo e histórico', () => {
  it('exige motivo nos dois sentidos e não repete a mesma transição', async () => {
    const id = tenant.restaurant.id;

    expect((await asOperator.post(`/restaurants/${id}/suspend`, {})).status).toBe(400);
    const suspended = await asOperator.post(`/restaurants/${id}/suspend`, { reason: 'Atraso' });
    expect(suspended.status).toBe(200);
    expect(
      (await asOperator.post(`/restaurants/${id}/suspend`, { reason: 'De novo' })).status,
    ).toBe(409);

    expect((await asOperator.post(`/restaurants/${id}/reactivate`, {})).status).toBe(400);
    const reactivated = await asOperator.post(`/restaurants/${id}/reactivate`, {
      reason: 'Pagamento recebido',
    });
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.data.status).toBe('ACTIVE');

    const items = (await history(id)).body.data.items;
    const suspension = items.find((item) => item.action === 'RESTAURANT_SUSPENDED');
    const reactivation = items.find((item) => item.action === 'RESTAURANT_REACTIVATED');
    expect(suspension.reason).toBe('Atraso');
    expect(reactivation.reason).toBe('Pagamento recebido');
    // A suspensão encerrada continua registrada no histórico.
    expect(reactivation.metadata.suspensionReason).toBe('Atraso');

    // Nada foi apagado.
    expect(await prisma.product.count({ where: { restaurantId: id } })).toBe(4);
    expect(await prisma.adminUser.count({ where: { restaurantId: id } })).toBeGreaterThan(0);
  });

  it('responde 404 para restaurante inexistente', async () => {
    const response = await asOperator.post(`/restaurants/${randomUUID()}/suspend`, {
      reason: 'Teste',
    });
    expect(response.status).toBe(404);
  });
});

describe('responsáveis (administradores)', () => {
  it('edita, bloqueia e desbloqueia o acesso com registro no histórico', async () => {
    const restaurantId = tenant.restaurant.id;
    const adminId = tenant.admin.id;
    const base = `/restaurants/${restaurantId}/admins/${adminId}`;
    const newEmail = `editado-${randomUUID()}@teste.local`;

    const edited = await asOperator.patch(base, { name: 'Responsável Editado', email: newEmail });
    expect(edited.status).toBe(200);
    expect(edited.body.data).toMatchObject({ name: 'Responsável Editado', email: newEmail });

    const blocked = await asOperator.post(`${base}/block`, { reason: 'Saiu da empresa' });
    expect(blocked.status).toBe(200);
    expect(blocked.body.data.blocked).toBe(true);
    // A sessão aberta foi encerrada e o login passa a ser recusado.
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', tenant.cookie);
    expect(me.status).toBe(401);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newEmail, password: 'senha-de-teste-123' });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('USER_DISABLED');

    expect((await asOperator.post(`${base}/block`, {})).status).toBe(409);

    const unblocked = await asOperator.post(`${base}/unblock`, {});
    expect(unblocked.status).toBe(200);
    expect(unblocked.body.data.blocked).toBe(false);
    const loginAgain = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newEmail, password: 'senha-de-teste-123' });
    expect(loginAgain.status).toBe(200);

    const actions = (await history(restaurantId)).body.data.items.map((item) => item.action);
    expect(actions).toEqual(
      expect.arrayContaining(['ADMIN_UPDATED', 'ADMIN_BLOCKED', 'ADMIN_UNBLOCKED']),
    );
  });

  it('recusa e-mail já usado por outro administrador', async () => {
    const other = await asOperator.post(`/restaurants/${tenant.restaurant.id}/admins`, {
      name: 'Outro',
      email: `outro-${randomUUID()}@teste.local`,
      password: ADMIN_PASSWORD,
    });
    expect(other.status).toBe(201);

    const response = await asOperator.patch(
      `/restaurants/${tenant.restaurant.id}/admins/${other.body.data.id}`,
      { email: (await prisma.adminUser.findUnique({ where: { id: tenant.admin.id } })).email },
    );
    expect(response.status).toBe(409);
    expect(response.body.error.details[0].path).toBe('email');
  });

  it('não altera administrador de outro restaurante', async () => {
    const otherRestaurant = createdRestaurantIds[0];
    const response = await asOperator.post(
      `/restaurants/${otherRestaurant}/admins/${tenant.admin.id}/block`,
      {},
    );
    expect(response.status).toBe(404);
  });
});

describe('módulos e histórico', () => {
  it('registra só os módulos alterados (antes e depois)', async () => {
    const response = await asOperator.put(`/restaurants/${tenant.restaurant.id}/features`, {
      customization: true,
      qrcode: false,
      realtime: true,
      productModal: true,
    });
    expect(response.status).toBe(200);

    const event = (await history(tenant.restaurant.id)).body.data.items.find(
      (item) => item.action === 'FEATURES_UPDATED',
    );
    expect(event.metadata.changes).toEqual({ qrcode: { from: true, to: false } });
  });

  it('pagina o histórico em ordem decrescente', async () => {
    const page = await asOperator.get(
      `/audit-events?restaurantId=${tenant.restaurant.id}&page=1&pageSize=2`,
    );
    expect(page.status).toBe(200);
    expect(page.body.data.items).toHaveLength(2);
    expect(page.body.data.total).toBeGreaterThan(2);
    const [first, second] = page.body.data.items;
    expect(new Date(first.occurredAt) >= new Date(second.occurredAt)).toBe(true);
  });

  it('o histórico exige sessão de operador', async () => {
    const response = await request(app)
      .get('/api/v1/platform/audit-events')
      .set('Cookie', tenant.cookie);
    expect(response.status).toBe(401);
  });
});
