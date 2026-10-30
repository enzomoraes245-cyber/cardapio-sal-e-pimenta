import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { subscribeToMenuUpdates } from '../../src/shared/events/menu-events.js';
import { hashPassword } from '../../src/shared/utils/password.js';
import { createPlatformAdminFixture, createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
const ADMIN_PASSWORD = 'senha-do-restaurante-1';
let operator;
let tenant;
let created;
const createdRestaurantIds = [];

beforeAll(async () => {
  operator = await createPlatformAdminFixture();
  tenant = await createTenantFixture('plat');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenant.restaurant.id, ...createdRestaurantIds]);
  await prisma.platformAdmin.delete({ where: { id: operator.platformAdmin.id } });
  await prisma.$disconnect();
});

const asOperator = {
  get: (url) => request(app).get(`/api/v1/platform${url}`).set('Cookie', operator.cookie),
  post: (url, body) =>
    request(app).post(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
  put: (url, body) =>
    request(app).put(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
  patch: (url, body) =>
    request(app).patch(`/api/v1/platform${url}`).set('Cookie', operator.cookie).send(body),
};

function newRestaurantBody(overrides = {}) {
  const suffix = randomUUID().slice(0, 8);
  return {
    slug: `novo-${suffix}`,
    name: `Novo ${suffix}`,
    admin: { name: 'Dona', email: `dona-${suffix}@teste.local`, password: ADMIN_PASSWORD },
    subscription: { monthlyAmount: '149,90', dueDay: 5 },
    features: { qrcode: false },
    ...overrides,
  };
}

const publicMenu = (slug) => request(app).get(`/api/v1/public/restaurants/${slug}/menu`);

describe('acesso ao backoffice', () => {
  it('exige sessão de operador; sessão de restaurante não serve', async () => {
    const anonymous = await request(app).get('/api/v1/platform/restaurants');
    const restaurantAdmin = await request(app)
      .get('/api/v1/platform/restaurants')
      .set('Cookie', tenant.cookie);

    expect(anonymous.status).toBe(401);
    expect(restaurantAdmin.status).toBe(401);
  });

  it('login do operador abre sessão própria', async () => {
    const email = `login-${randomUUID()}@teste.local`;
    const platformAdmin = await prisma.platformAdmin.create({
      data: { email, name: 'Login', passwordHash: await hashPassword('senha-123456') },
    });
    const response = await request(app)
      .post('/api/v1/platform/auth/login')
      .send({ email, password: 'senha-123456' });
    await prisma.platformAdmin.delete({ where: { id: platformAdmin.id } });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toMatch(/^cd_platform_session=.+HttpOnly/);
  });
});

describe('cadastro de restaurantes (DEC-006)', () => {
  it('cria restaurante, primeiro administrador, assinatura e módulos', async () => {
    const body = newRestaurantBody();
    const response = await asOperator.post('/restaurants', body);

    expect(response.status).toBe(201);
    created = response.body.data;
    createdRestaurantIds.push(created.id);
    expect(created).toMatchObject({
      slug: body.slug,
      status: 'ACTIVE',
      subscription: { monthlyAmount: '149.90', dueDay: 5 },
      features: { customization: true, qrcode: false, realtime: true, productModal: true },
      overdueInvoices: 0,
      admins: [{ email: body.admin.email, name: 'Dona' }],
    });
    expect(JSON.stringify(created)).not.toContain('passwordHash');

    // O administrador criado entra na retaguarda do novo restaurante.
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.admin.email, password: ADMIN_PASSWORD });
    expect(login.status).toBe(200);
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);
    expect(me.body.data.restaurant.slug).toBe(body.slug);
    expect(me.body.data.features.qrcode).toBe(false);
  });

  it('recusa slug ou e-mail repetidos com 409', async () => {
    const slugTaken = await asOperator.post(
      '/restaurants',
      newRestaurantBody({ slug: created.slug }),
    );
    const emailTaken = await asOperator.post(
      '/restaurants',
      newRestaurantBody({
        admin: { name: 'X', email: created.admins[0].email, password: ADMIN_PASSWORD },
      }),
    );

    expect(slugTaken.status).toBe(409);
    expect(slugTaken.body.error.code).toBe('SLUG_TAKEN');
    expect(emailTaken.status).toBe(409);
    expect(emailTaken.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('valida slug, senha e dia de vencimento', async () => {
    const response = await asOperator.post(
      '/restaurants',
      newRestaurantBody({
        slug: 'Slug Inválido',
        admin: { name: 'X', email: 'x@teste.local', password: '123' },
        subscription: { monthlyAmount: '10', dueDay: 31 },
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.path).sort()).toEqual([
      'admin.password',
      'slug',
      'subscription.dueDay',
    ]);
  });
});

describe('suspensão (DEC-006, item 3)', () => {
  it('bloqueia retaguarda e cardápio público e avisa os cardápios abertos', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenant.restaurant.id, (e) => events.push(e));

    const response = await asOperator.post(`/restaurants/${tenant.restaurant.id}/suspend`, {
      reason: 'Mensalidade em atraso',
    });
    unsubscribe();

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'SUSPENDED',
      suspensionReason: 'Mensalidade em atraso',
    });
    expect(events).toHaveLength(1);

    const menu = await publicMenu(tenant.restaurant.slug);
    expect(menu.status).toBe(403);
    expect(menu.body.error.code).toBe('RESTAURANT_SUSPENDED');

    const admin = await request(app).get('/api/v1/admin/products').set('Cookie', tenant.cookie);
    expect(admin.status).toBe(403);
    expect(admin.body.error.code).toBe('RESTAURANT_SUSPENDED');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: tenant.admin.email, password: 'senha-de-teste-123' });
    expect(login.status).toBe(403);
  });

  it('reativação restaura o acesso sem mudar o slug', async () => {
    const response = await asOperator.post(`/restaurants/${tenant.restaurant.id}/reactivate`, {
      reason: 'Pagamento regularizado',
    });

    expect(response.body.data).toMatchObject({
      status: 'ACTIVE',
      slug: tenant.restaurant.slug,
      suspensionReason: null,
    });
    expect((await publicMenu(tenant.restaurant.slug)).status).toBe(200);
    const admin = await request(app).get('/api/v1/admin/products').set('Cookie', tenant.cookie);
    expect(admin.status).toBe(200);
  });
});

describe('módulos liberáveis (DEC-006, item 4)', () => {
  it('desligar módulos bloqueia a retaguarda e muda o cardápio público', async () => {
    await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenant.cookie)
      .send({ primaryColor: '#1e3a8a' });

    const response = await asOperator.put(`/restaurants/${tenant.restaurant.id}/features`, {
      customization: false,
      qrcode: false,
      realtime: false,
      productModal: false,
    });
    expect(response.status).toBe(200);

    const customization = await request(app)
      .get('/api/v1/admin/customization')
      .set('Cookie', tenant.cookie);
    const qrcode = await request(app).get('/api/v1/admin/qrcode').set('Cookie', tenant.cookie);
    expect(customization.status).toBe(403);
    expect(customization.body.error.code).toBe('FEATURE_DISABLED');
    expect(qrcode.status).toBe(403);

    const menu = await publicMenu(tenant.restaurant.slug);
    expect(menu.body.data.restaurant.primaryColor).toBeNull();
    expect(menu.body.data.features).toEqual({ realtime: false, productModal: false });

    const events = await request(app).get(
      `/api/v1/public/restaurants/${tenant.restaurant.slug}/events`,
    );
    expect(events.status).toBe(403);
  });

  it('religar restaura a personalização salva', async () => {
    await asOperator.put(`/restaurants/${tenant.restaurant.id}/features`, {
      customization: true,
      qrcode: true,
      realtime: true,
      productModal: true,
    });

    const menu = await publicMenu(tenant.restaurant.slug);
    expect(menu.body.data.restaurant.primaryColor).toBe('#1e3a8a');
  });
});

describe('administradores do restaurante', () => {
  it('cria administrador adicional e redefine a senha encerrando as sessões', async () => {
    const email = `extra-${randomUUID()}@teste.local`;
    const createdAdmin = await asOperator.post(`/restaurants/${tenant.restaurant.id}/admins`, {
      name: 'Gerente',
      email,
      password: ADMIN_PASSWORD,
    });
    expect(createdAdmin.status).toBe(201);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: ADMIN_PASSWORD });
    const cookie = login.headers['set-cookie'][0].split(';')[0];

    const reset = await asOperator.put(
      `/restaurants/${tenant.restaurant.id}/admins/${createdAdmin.body.data.id}/password`,
      { password: 'nova-senha-segura' },
    );
    expect(reset.status).toBe(204);

    const oldSession = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(oldSession.status).toBe(401);
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'nova-senha-segura' });
    expect(newLogin.status).toBe(200);
  });
});

describe('cobrança manual (DEC-006, item 2)', () => {
  const month = '2026-01';

  it('gera as faturas do mês uma única vez', async () => {
    // Assinaturas iniciadas antes do mês de referência do teste.
    const subscriptions = await Promise.all([
      asOperator.put(`/restaurants/${tenant.restaurant.id}/subscription`, {
        monthlyAmount: '89.90',
        dueDay: 10,
        startedAt: '2025-12-01',
      }),
      asOperator.put(`/restaurants/${created.id}/subscription`, {
        monthlyAmount: '149.90',
        dueDay: 5,
        startedAt: '2025-12-01',
      }),
    ]);
    expect(subscriptions.map((response) => response.status)).toEqual([200, 200]);

    const first = await asOperator.post('/invoices/generate', { month });
    const second = await asOperator.post('/invoices/generate', { month });

    expect(first.status).toBe(200);
    expect(first.body.data.created).toBeGreaterThanOrEqual(2);
    expect(second.body.data.created).toBe(0);

    const invoices = await asOperator.get(
      `/invoices?from=${month}&to=${month}&restaurantId=${tenant.restaurant.id}`,
    );
    expect(invoices.body.data).toMatchObject({ total: 1, sum: '89.90' });
    expect(invoices.body.data.items).toEqual([
      expect.objectContaining({
        referenceMonth: month,
        amount: '89.90',
        dueDate: '2026-01-10',
        status: 'OPEN',
        situation: 'overdue',
        overdue: true,
        payment: null,
      }),
    ]);
  });

  it('registra o pagamento e a fatura deixa de constar como vencida', async () => {
    const overdue = await asOperator.get(
      `/invoices?situation=overdue&restaurantId=${tenant.restaurant.id}`,
    );
    expect(overdue.body.data.items).toHaveLength(1);

    const paid = await asOperator.post(`/invoices/${overdue.body.data.items[0].id}/payments`, {
      paidOn: '2026-01-12',
      method: 'PIX',
    });
    expect(paid.status).toBe(201);
    expect(paid.body.data).toMatchObject({
      status: 'PAID',
      situation: 'paid',
      overdue: false,
      payment: {
        amount: '89.90',
        paidOn: '2026-01-12',
        method: 'PIX',
        recordedBy: { name: operator.platformAdmin.name },
        voided: false,
      },
    });

    const afterPayment = await asOperator.get(
      `/invoices?situation=overdue&restaurantId=${tenant.restaurant.id}`,
    );
    expect(afterPayment.body.data.items).toHaveLength(0);
    const list = await asOperator.get('/restaurants');
    expect(list.body.data.find((r) => r.id === tenant.restaurant.id).overdueInvoices).toBe(0);
  });

  it('não fatura restaurante suspenso', async () => {
    await asOperator.post(`/restaurants/${created.id}/suspend`, { reason: 'Teste' });

    const response = await asOperator.post('/invoices/generate', { month: '2026-02' });
    const invoices = await asOperator.get(
      `/invoices?from=2026-02&to=2026-02&restaurantId=${created.id}`,
    );

    expect(response.status).toBe(200);
    expect(invoices.body.data.items).toHaveLength(0);
  });
});
