import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { subscribeToMenuUpdates } from '../../src/shared/events/menu-events.js';
import { createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';
import { FAKE_PNG, OTHER_PNG, VALID_PNG, storedFileExists } from './helpers/images.js';

const app = createApp();
let tenantA;
let tenantB;

beforeAll(async () => {
  tenantA = await createTenantFixture('pers-a');
  tenantB = await createTenantFixture('pers-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  await prisma.$disconnect();
});

const publicRestaurant = async (tenant) =>
  (await request(app).get(`/api/v1/public/restaurants/${tenant.restaurant.slug}/menu`)).body.data
    .restaurant;

const sendLogo = (tenant, image) =>
  request(app)
    .put('/api/v1/admin/customization/logo')
    .set('Cookie', tenant.cookie)
    .attach('logo', image, 'logo.png');

describe('personalização (MOD-10)', () => {
  it('altera as cores só do próprio restaurante e avisa os cardápios abertos', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenantA.restaurant.id, (e) => events.push(e));

    const response = await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenantA.cookie)
      .send({ primaryColor: '#1E3A8A', secondaryColor: null });
    unsubscribe();

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ primaryColor: '#1e3a8a', secondaryColor: null });
    expect(events).toHaveLength(1);
    expect(await publicRestaurant(tenantA)).toMatchObject({ primaryColor: '#1e3a8a' });
    // RF-040 / RN-015: o outro restaurante não é afetado.
    expect(await publicRestaurant(tenantB)).toMatchObject({
      name: 'Restaurante pers-b',
      primaryColor: '#123456',
    });
  });

  it('o nome não é alterado pela personalização (fica em Dados do estabelecimento)', async () => {
    const response = await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Outro nome', primaryColor: '#123123' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Restaurante pers-a');
  });

  it('valida o formato das cores', async () => {
    const response = await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenantA.cookie)
      .send({ primaryColor: 'azul' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.path)).toEqual(['primaryColor']);
  });

  it('envia e substitui o logotipo exibido no cardápio (CA-032)', async () => {
    const first = await sendLogo(tenantA, VALID_PNG);
    expect(first.status).toBe(200);
    expect(first.body.data.logoUrl).toMatch(`/uploads/restaurants/${tenantA.restaurant.id}/logo/`);
    expect((await publicRestaurant(tenantA)).logoUrl).toBe(first.body.data.logoUrl);

    const second = await sendLogo(tenantA, OTHER_PNG);
    expect(second.body.data.logoUrl).not.toBe(first.body.data.logoUrl);
    expect(storedFileExists(second.body.data.logoUrl)).toBe(true);
    expect(storedFileExists(first.body.data.logoUrl)).toBe(false);
  });

  it('recusa logotipo que não é imagem', async () => {
    const response = await sendLogo(tenantA, FAKE_PNG);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_IMAGE');
  });

  it('cada administrador vê somente a personalização do seu restaurante', async () => {
    const response = await request(app)
      .get('/api/v1/admin/customization')
      .set('Cookie', tenantB.cookie);

    expect(response.body.data).toMatchObject({ slug: tenantB.restaurant.slug, logoUrl: null });
  });
});
