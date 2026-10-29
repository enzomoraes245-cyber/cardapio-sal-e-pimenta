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
let productId;

beforeAll(async () => {
  tenantA = await createTenantFixture('disp-a');
  tenantB = await createTenantFixture('disp-b');
  const product = await prisma.product.findFirst({
    where: { restaurantId: tenantA.restaurant.id, name: 'Disponível disp-a' },
  });
  productId = product.id;
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  await prisma.$disconnect();
});

const setStatus = (tenant, body, id = productId) =>
  request(app).patch(`/api/v1/admin/products/${id}/status`).set('Cookie', tenant.cookie).send(body);

async function isPublished() {
  const menu = await request(app).get(`/api/v1/public/restaurants/${tenantA.restaurant.slug}/menu`);
  return menu.body.data.categories.some((c) => c.products.some((p) => p.id === productId));
}

describe('situação do produto (MOD-04)', () => {
  it('produto inativo sai do cardápio e os cardápios abertos são avisados (CA-012)', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenantA.restaurant.id, (e) => events.push(e));

    const response = await setStatus(tenantA, { isActive: false });
    unsubscribe();

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ isActive: false, isAvailable: true });
    expect(await isPublished()).toBe(false);
    expect(events).toHaveLength(1);
  });

  it('produto indisponível sai do cardápio (CA-013)', async () => {
    await setStatus(tenantA, { isActive: true, isAvailable: false });

    expect(await isPublished()).toBe(false);
  });

  it('volta automaticamente ao ficar ativo e disponível (CA-014)', async () => {
    const response = await setStatus(tenantA, { isAvailable: true });

    expect(response.body.data).toMatchObject({ isActive: true, isAvailable: true });
    expect(await isPublished()).toBe(true);
  });

  it('valida o corpo da requisição', async () => {
    const empty = await setStatus(tenantA, {});
    const wrongType = await setStatus(tenantA, { isAvailable: 'nao' });

    expect(empty.status).toBe(400);
    expect(wrongType.status).toBe(400);
  });

  it('não altera produto de outro restaurante (CA-003)', async () => {
    const response = await setStatus(tenantB, { isAvailable: false });

    expect(response.status).toBe(404);
    expect(await isPublished()).toBe(true);
  });
});
