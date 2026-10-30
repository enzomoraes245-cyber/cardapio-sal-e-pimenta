import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { storageConfig } from '../../src/config/storage.js';
import { subscribeToMenuUpdates } from '../../src/shared/events/menu-events.js';
import { createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';
import { OTHER_PNG, VALID_PNG, storedFileExists } from './helpers/images.js';

const app = createApp();
let tenant;
let other;

beforeAll(async () => {
  tenant = await createTenantFixture('painel');
  other = await createTenantFixture('painel-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenant.restaurant.id, other.restaurant.id]);
  await prisma.$disconnect();
});

const as = (owner) => ({
  get: (url) => request(app).get(`/api/v1/admin${url}`).set('Cookie', owner.cookie),
  put: (url, body) =>
    request(app).put(`/api/v1/admin${url}`).set('Cookie', owner.cookie).send(body),
  patch: (url, body) =>
    request(app).patch(`/api/v1/admin${url}`).set('Cookie', owner.cookie).send(body),
  post: (url, body, headers = {}) =>
    request(app).post(`/api/v1/admin${url}`).set('Cookie', owner.cookie).set(headers).send(body),
  delete: (url) => request(app).delete(`/api/v1/admin${url}`).set('Cookie', owner.cookie),
});

function postProduct(owner, fields, image, headers = {}) {
  const req = request(app).post('/api/v1/admin/products').set('Cookie', owner.cookie).set(headers);
  for (const [field, value] of Object.entries(fields)) req.field(field, value);
  if (image) req.attach('image', image, 'foto.png');
  return req;
}

const sendImage = (owner, productId, image) =>
  request(app)
    .put(`/api/v1/admin/products/${productId}/image`)
    .set('Cookie', owner.cookie)
    .attach('image', image, 'foto.png');

const publicMenu = (slug) => request(app).get(`/api/v1/public/restaurants/${slug}/menu`);

async function publicProductNames(slug) {
  const { body } = await publicMenu(slug);
  return body.data.categories.flatMap((category) => category.products.map((p) => p.name));
}

/** Os arquivos da pasta são exatamente os referenciados no banco: nenhum órfão. */
async function expectNoOrphanProductImages(owner) {
  const folder = path.join(storageConfig.localDir, 'restaurants', owner.restaurant.id, 'products');
  const products = await prisma.product.findMany({
    where: { restaurantId: owner.restaurant.id, imageKey: { not: null } },
    select: { imageKey: true },
  });
  const referenced = products
    .map((product) => path.basename(product.imageKey))
    .filter((name) => name !== 'fixture.png');
  const stored = existsSync(folder) ? readdirSync(folder) : [];
  expect(stored.sort()).toEqual(referenced.sort());
}

describe('dados do estabelecimento (DEC-009)', () => {
  it('altera nome e contato, registra no histórico e só o nome chega ao cardápio', async () => {
    const events = [];
    const unsubscribe = subscribeToMenuUpdates(tenant.restaurant.id, (e) => events.push(e));
    const response = await as(tenant).put('/establishment', {
      name: 'Painel Renomeado',
      contactPhone: '(11) 4002-8922',
      contactEmail: 'CONTATO@painel.local',
    });
    unsubscribe();

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: 'Painel Renomeado',
      slug: tenant.restaurant.slug,
      contactPhone: '(11) 4002-8922',
      contactEmail: 'contato@painel.local',
    });
    expect(response.body.data.publicUrl).toMatch(
      new RegExp(`/cardapio/${tenant.restaurant.slug}$`),
    );
    expect(events).toHaveLength(1);

    const menu = await publicMenu(tenant.restaurant.slug);
    expect(menu.body.data.restaurant.name).toBe('Painel Renomeado');
    // O contato nunca aparece no cardápio público.
    expect(JSON.stringify(menu.body)).not.toContain('4002-8922');
    expect(JSON.stringify(menu.body)).not.toContain('contato@painel.local');

    const event = await prisma.auditEvent.findFirst({
      where: { restaurantId: tenant.restaurant.id, action: 'ESTABLISHMENT_UPDATED' },
    });
    expect(event).toMatchObject({ actorType: 'RESTAURANT_ADMIN', actorId: tenant.admin.id });
  });

  it('continua disponível com o módulo de personalização bloqueado', async () => {
    await prisma.restaurantFeature.create({
      data: { restaurantId: other.restaurant.id, feature: 'CUSTOMIZATION', enabled: false },
    });
    const response = await as(other).put('/establishment', { name: 'Sem personalização' });
    const customization = await as(other).get('/customization');
    await prisma.restaurantFeature.deleteMany({ where: { restaurantId: other.restaurant.id } });

    expect(response.status).toBe(200);
    expect(customization.status).toBe(403);
  });

  it('valida telefone e e-mail e ignora campos que só a plataforma altera', async () => {
    const invalid = await as(tenant).put('/establishment', {
      name: 'X',
      contactPhone: '12',
      contactEmail: 'nao-e-email',
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.map((d) => d.path).sort()).toEqual([
      'contactEmail',
      'contactPhone',
    ]);

    const response = await as(tenant).put('/establishment', {
      name: 'Painel Renomeado',
      slug: 'outro-endereco',
      status: 'SUSPENDED',
    });
    expect(response.status).toBe(200);
    const restaurant = await prisma.restaurant.findUnique({ where: { id: tenant.restaurant.id } });
    expect(restaurant).toMatchObject({ slug: tenant.restaurant.slug, status: 'ACTIVE' });
  });
});

describe('categorias ativas e ocultas', () => {
  it('ocultar tira categoria e produtos do cardápio sem apagar nada; reativar devolve', async () => {
    const categoryId = tenant.category.id;
    const ids = async () =>
      (await publicMenu(tenant.restaurant.slug)).body.data.categories.map((c) => c.id);
    expect(await ids()).toContain(categoryId);

    const hidden = await as(tenant).patch(`/categories/${categoryId}/status`, { isActive: false });
    expect(hidden.status).toBe(200);
    expect(hidden.body.data).toMatchObject({
      isActive: false,
      productCount: 4,
      publishableCount: 1,
    });
    expect(await ids()).not.toContain(categoryId);
    expect(await prisma.product.count({ where: { categoryId } })).toBe(4);

    const shown = await as(tenant).patch(`/categories/${categoryId}/status`, { isActive: true });
    expect(shown.body.data.isActive).toBe(true);
    expect(await ids()).toContain(categoryId);
  });

  it('lista com situação e contagens; categoria de outro restaurante responde 404', async () => {
    const list = await as(tenant).get('/categories');
    expect(list.body.data[0]).toMatchObject({
      isActive: true,
      productCount: 4,
      publishableCount: 1,
    });

    const foreign = await as(other).patch(`/categories/${tenant.category.id}/status`, {
      isActive: false,
    });
    expect(foreign.status).toBe(404);
  });

  it('com a mesma Idempotency-Key, o envio repetido cria uma só categoria', async () => {
    const key = randomUUID();
    const [first, second] = await Promise.all([
      as(tenant).post('/categories', { name: 'Bebidas' }, { 'Idempotency-Key': key }),
      as(tenant).post('/categories', { name: 'Bebidas' }, { 'Idempotency-Key': key }),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 201]);
    expect(first.body.data.id).toBe(second.body.data.id);
    expect(
      await prisma.category.count({
        where: { restaurantId: tenant.restaurant.id, name: 'Bebidas' },
      }),
    ).toBe(1);
  });
});

describe('produtos: foto opcional (DEC-007), remoção e idempotência', () => {
  it('sem foto é salvo e só entra no cardápio depois de receber uma; remover tira de novo', async () => {
    const created = await postProduct(tenant, {
      name: 'Sem foto ainda',
      price: '15',
      categoryId: tenant.category.id,
    });
    expect(created.status).toBe(201);
    expect(created.body.data.imageUrl).toBeNull();
    expect(await publicProductNames(tenant.restaurant.slug)).not.toContain('Sem foto ainda');

    const withPhoto = await sendImage(tenant, created.body.data.id, VALID_PNG);
    expect(withPhoto.status).toBe(200);
    expect(await publicProductNames(tenant.restaurant.slug)).toContain('Sem foto ainda');

    const removed = await as(tenant).delete(`/products/${created.body.data.id}/image`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.imageUrl).toBeNull();
    expect(storedFileExists(withPhoto.body.data.imageUrl)).toBe(false);
    expect(await publicProductNames(tenant.restaurant.slug)).not.toContain('Sem foto ainda');
    await expectNoOrphanProductImages(tenant);
  });

  it('não remove a foto de produto de outro restaurante', async () => {
    const product = await prisma.product.findFirst({
      where: { restaurantId: tenant.restaurant.id, imageKey: { not: null } },
    });
    const response = await as(other).delete(`/products/${product.id}/image`);
    expect(response.status).toBe(404);
    expect(
      (await prisma.product.findUnique({ where: { id: product.id } })).imageKey,
    ).not.toBeNull();
  });

  it('a mesma Idempotency-Key cria um só produto e descarta a foto reenviada', async () => {
    const key = randomUUID();
    const fields = { name: 'Produto único', price: '20', categoryId: tenant.category.id };
    const first = await postProduct(tenant, fields, VALID_PNG, { 'Idempotency-Key': key });
    const second = await postProduct(tenant, fields, OTHER_PNG, { 'Idempotency-Key': key });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(
      await prisma.product.count({
        where: { restaurantId: tenant.restaurant.id, name: 'Produto único' },
      }),
    ).toBe(1);
    await expectNoOrphanProductImages(tenant);
  });

  it('trocas simultâneas de foto não deixam arquivos órfãos', async () => {
    const created = await postProduct(
      tenant,
      { name: 'Concorrência', price: '12', categoryId: tenant.category.id },
      VALID_PNG,
    );
    const responses = await Promise.all(
      [OTHER_PNG, VALID_PNG, OTHER_PNG].map((image) =>
        sendImage(tenant, created.body.data.id, image),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    await expectNoOrphanProductImages(tenant);
  });
});

describe('logotipo', () => {
  const sendLogo = (owner, image) =>
    request(app)
      .put('/api/v1/admin/customization/logo')
      .set('Cookie', owner.cookie)
      .attach('logo', image, 'logo.png');

  it('remove o logotipo, apaga o arquivo e o cardápio deixa de exibi-lo', async () => {
    const sent = await sendLogo(tenant, VALID_PNG);
    expect(sent.status).toBe(200);

    const removed = await as(tenant).delete('/customization/logo');
    expect(removed.status).toBe(200);
    expect(removed.body.data.logoUrl).toBeNull();
    expect(storedFileExists(sent.body.data.logoUrl)).toBe(false);
    expect((await publicMenu(tenant.restaurant.slug)).body.data.restaurant.logoUrl).toBeNull();
  });

  it('envios simultâneos deixam um único arquivo, o do logotipo atual', async () => {
    await Promise.all([VALID_PNG, OTHER_PNG, VALID_PNG].map((image) => sendLogo(other, image)));

    const folder = path.join(storageConfig.localDir, 'restaurants', other.restaurant.id, 'logo');
    const current = await prisma.restaurantCustomization.findUnique({
      where: { restaurantId: other.restaurant.id },
    });
    expect(readdirSync(folder)).toEqual([path.basename(current.logoKey)]);
  });
});
