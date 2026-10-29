import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { subscribeToMenuUpdates } from '../../src/shared/events/menu-events.js';
import { createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
let tenantA;
let tenantB;

beforeAll(async () => {
  tenantA = await createTenantFixture('cat-a');
  tenantB = await createTenantFixture('cat-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  await prisma.$disconnect();
});

const as = (tenant) => ({
  get: (url) => request(app).get(url).set('Cookie', tenant.cookie),
  post: (url, body) => request(app).post(url).set('Cookie', tenant.cookie).send(body),
  patch: (url, body) => request(app).patch(url).set('Cookie', tenant.cookie).send(body),
  put: (url, body) => request(app).put(url).set('Cookie', tenant.cookie).send(body),
});

describe('categorias', () => {
  it('cria a categoria no restaurante da sessão, ignorando restaurantId do corpo (CA-004)', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenantA.restaurant.id, (e) => events.push(e));

    const response = await as(tenantA).post('/api/v1/admin/categories', {
      name: '  Sobremesas ',
      restaurantId: tenantB.restaurant.id,
    });
    unsubscribe();

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ name: 'Sobremesas', position: 1, productCount: 0 });
    const saved = await prisma.category.findUnique({ where: { id: response.body.data.id } });
    expect(saved.restaurantId).toBe(tenantA.restaurant.id);
    expect(events).toHaveLength(1);
  });

  it('lista apenas as categorias do próprio restaurante', async () => {
    const response = await as(tenantB).get('/api/v1/admin/categories');

    expect(response.status).toBe(200);
    expect(response.body.data.map((c) => c.name)).toEqual(['Categoria cat-b']);
  });

  it('exige nome', async () => {
    const response = await as(tenantA).post('/api/v1/admin/categories', { name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0]).toMatchObject({ path: 'name' });
  });

  it('renomeia e reflete no cardápio público (CA-005)', async () => {
    const response = await as(tenantA).patch(`/api/v1/admin/categories/${tenantA.category.id}`, {
      name: 'Pratos do dia',
    });
    expect(response.status).toBe(200);

    const menu = await request(app).get(
      `/api/v1/public/restaurants/${tenantA.restaurant.slug}/menu`,
    );
    expect(menu.body.data.categories[0].name).toBe('Pratos do dia');
  });

  it('não permite renomear categoria de outro restaurante (CA-003)', async () => {
    const response = await as(tenantB).patch(`/api/v1/admin/categories/${tenantA.category.id}`, {
      name: 'Invadida',
    });

    expect(response.status).toBe(404);
    const unchanged = await prisma.category.findUnique({ where: { id: tenantA.category.id } });
    expect(unchanged.name).toBe('Pratos do dia');
  });

  it('reordena e o cardápio público segue a ordem salva (CA-006)', async () => {
    const extra = await as(tenantA).post('/api/v1/admin/categories', { name: 'Primeira' });
    await prisma.product.create({
      data: {
        restaurantId: tenantA.restaurant.id,
        categoryId: extra.body.data.id,
        name: 'Produto da primeira',
        price: '5.00',
        imageKey: 'x.png',
      },
    });
    const current = await as(tenantA).get('/api/v1/admin/categories');
    const ids = current.body.data.map((c) => c.id);
    const reordered = [extra.body.data.id, ...ids.filter((id) => id !== extra.body.data.id)];

    const response = await as(tenantA).put('/api/v1/admin/categories/order', { ids: reordered });

    expect(response.status).toBe(200);
    expect(response.body.data.map((c) => c.id)).toEqual(reordered);
    const menu = await request(app).get(
      `/api/v1/public/restaurants/${tenantA.restaurant.slug}/menu`,
    );
    expect(menu.body.data.categories.map((c) => c.name)).toEqual(['Primeira', 'Pratos do dia']);
  });

  it('recusa ordem incompleta ou com categoria de outro restaurante', async () => {
    const current = await as(tenantA).get('/api/v1/admin/categories');
    const ids = current.body.data.map((c) => c.id);

    const incomplete = await as(tenantA).put('/api/v1/admin/categories/order', {
      ids: ids.slice(1),
    });
    const foreign = await as(tenantA).put('/api/v1/admin/categories/order', {
      ids: [...ids.slice(1), tenantB.category.id],
    });

    expect(incomplete.status).toBe(400);
    expect(foreign.status).toBe(400);
  });
});
