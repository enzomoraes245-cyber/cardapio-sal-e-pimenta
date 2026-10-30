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
let created;

beforeAll(async () => {
  tenantA = await createTenantFixture('prod-a');
  tenantB = await createTenantFixture('prod-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  await prisma.$disconnect();
});

function postProduct(tenant, fields, image = VALID_PNG) {
  const req = request(app).post('/api/v1/admin/products').set('Cookie', tenant.cookie);
  for (const [key, value] of Object.entries(fields)) req.field(key, value);
  if (image) req.attach('image', image, 'foto.png');
  return req;
}

const publicMenu = (tenant) =>
  request(app).get(`/api/v1/public/restaurants/${tenant.restaurant.slug}/menu`);

const publishedNames = (menu) =>
  menu.body.data.categories.flatMap((c) => c.products.map((p) => p.name));

describe('cadastro de produtos (MOD-03)', () => {
  it('cadastra com foto e publica no cardápio do restaurante (RF-009, RF-013)', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenantA.restaurant.id, (e) => events.push(e));

    const response = await postProduct(tenantA, {
      name: 'Pudim',
      price: '14,90',
      categoryId: tenantA.category.id,
      shortDescription: 'Pudim de leite.',
      detailedDescription: 'Pudim de leite condensado com calda de caramelo.',
    });
    unsubscribe();

    expect(response.status).toBe(201);
    created = response.body.data;
    expect(created).toMatchObject({
      name: 'Pudim',
      price: '14.90',
      isActive: true,
      isAvailable: true,
      category: { id: tenantA.category.id },
    });
    expect(created.imageUrl).toMatch(
      new RegExp(`^/uploads/restaurants/${tenantA.restaurant.id}/products/.+\\.png$`),
    );
    expect(storedFileExists(created.imageUrl)).toBe(true);
    expect(events).toHaveLength(1);

    const menu = await publicMenu(tenantA);
    const published = menu.body.data.categories[0].products.find((p) => p.id === created.id);
    expect(published).toMatchObject({ price: '14.90', imageUrl: created.imageUrl });

    const image = await request(app).get(created.imageUrl);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/png');
  });

  it('impede cadastro sem nome, preço válido ou categoria (CA-007; foto opcional, DEC-007)', async () => {
    const valid = { name: 'X', price: '10', categoryId: tenantA.category.id };
    const cases = [
      [{ ...valid, name: '' }, VALID_PNG, 'name'],
      [{ ...valid, price: '0' }, VALID_PNG, 'price'],
      [{ ...valid, price: '10,999' }, VALID_PNG, 'price'],
      [{ ...valid, price: 'abc' }, VALID_PNG, 'price'],
      [{ name: 'X', price: '10' }, VALID_PNG, 'categoryId'],
    ];

    for (const [fields, image, field] of cases) {
      const response = await postProduct(tenantA, fields, image);
      expect(response.status, field).toBe(400);
      expect(response.body.error.details.map((d) => d.path)).toContain(field);
    }
  });

  it('recusa arquivo que não é imagem, mesmo com extensão .png', async () => {
    const response = await postProduct(
      tenantA,
      { name: 'X', price: '10', categoryId: tenantA.category.id },
      FAKE_PNG,
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_IMAGE');
  });

  it('recusa imagem acima de 5 MB', async () => {
    const oversized = Buffer.concat([VALID_PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const response = await postProduct(
      tenantA,
      { name: 'X', price: '10', categoryId: tenantA.category.id },
      oversized,
    );

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('não aceita categoria de outro restaurante (RN-003)', async () => {
    const response = await postProduct(tenantA, {
      name: 'X',
      price: '10',
      categoryId: tenantB.category.id,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].path).toBe('categoryId');
  });
});

describe('edição de produtos (MOD-03)', () => {
  it('atualiza os dados publicados (CA-010)', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/products/${created.id}`)
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Pudim de leite', price: 16.5, shortDescription: '' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: 'Pudim de leite',
      price: '16.50',
      shortDescription: null,
    });
    expect(publishedNames(await publicMenu(tenantA))).toContain('Pudim de leite');
  });

  it('substitui a foto e remove a anterior (RF-012)', async () => {
    const response = await request(app)
      .put(`/api/v1/admin/products/${created.id}/image`)
      .set('Cookie', tenantA.cookie)
      .attach('image', OTHER_PNG, 'nova.png');

    expect(response.status).toBe(200);
    expect(response.body.data.imageUrl).not.toBe(created.imageUrl);
    expect(storedFileExists(response.body.data.imageUrl)).toBe(true);
    expect(storedFileExists(created.imageUrl)).toBe(false);
  });

  it('não permite ler nem alterar produto de outro restaurante (CA-003)', async () => {
    const asB = (req) => req.set('Cookie', tenantB.cookie);

    const read = await asB(request(app).get(`/api/v1/admin/products/${created.id}`));
    const edit = await asB(request(app).patch(`/api/v1/admin/products/${created.id}`)).send({
      price: '1.00',
    });
    const image = await asB(request(app).put(`/api/v1/admin/products/${created.id}/image`)).attach(
      'image',
      VALID_PNG,
      'x.png',
    );
    const list = await asB(request(app).get('/api/v1/admin/products'));

    expect([read.status, edit.status, image.status]).toEqual([404, 404, 404]);
    expect(list.body.data.map((p) => p.id)).not.toContain(created.id);
    const unchanged = await prisma.product.findUnique({ where: { id: created.id } });
    expect(unchanged.price.toFixed(2)).toBe('16.50');
  });
});

describe('ordenação de produtos (MOD-05)', () => {
  it('salva a ordem e o cardápio segue a sequência (CA-015, CA-016)', async () => {
    const categoryUrl = `/api/v1/admin/categories/${tenantA.category.id}/products/order`;
    const ids = (await prisma.product.findMany({ where: { categoryId: tenantA.category.id } })).map(
      (p) => p.id,
    );
    const reordered = [created.id, ...ids.filter((id) => id !== created.id)];

    const response = await request(app)
      .put(categoryUrl)
      .set('Cookie', tenantA.cookie)
      .send({ ids: reordered });

    expect(response.status).toBe(200);
    expect(response.body.data.map((p) => p.id)).toEqual(reordered);

    const list = await request(app).get('/api/v1/admin/products').set('Cookie', tenantA.cookie);
    expect(list.body.data.map((p) => p.id)).toEqual(reordered);
    expect(publishedNames(await publicMenu(tenantA))).toEqual([
      'Pudim de leite',
      'Disponível prod-a',
    ]);
  });

  it('recusa ordem incompleta e categoria de outro restaurante', async () => {
    const incomplete = await request(app)
      .put(`/api/v1/admin/categories/${tenantA.category.id}/products/order`)
      .set('Cookie', tenantA.cookie)
      .send({ ids: [created.id] });
    const foreign = await request(app)
      .put(`/api/v1/admin/categories/${tenantA.category.id}/products/order`)
      .set('Cookie', tenantB.cookie)
      .send({ ids: [created.id] });

    expect(incomplete.status).toBe(400);
    expect(foreign.status).toBe(404);
  });
});
