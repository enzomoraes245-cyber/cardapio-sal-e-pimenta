import { EventEmitter, once } from 'node:events';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { streamMenuEvents } from '../../src/modules/menu/menu.controller.js';
import { countMenuSubscribers, publishMenuUpdated } from '../../src/shared/events/menu-events.js';
import { createRestaurantFixture, deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
let fixtureA;
let fixtureB;

beforeAll(async () => {
  fixtureA = await createRestaurantFixture('a');
  fixtureB = await createRestaurantFixture('b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([fixtureA.restaurant.id, fixtureB.restaurant.id]);
  await prisma.$disconnect();
});

describe('GET /api/v1/public/restaurants/:slug/menu', () => {
  it('retorna só dados publicáveis e produtos ativos, disponíveis e com foto', async () => {
    const response = await request(app).get(
      `/api/v1/public/restaurants/${fixtureA.restaurant.slug}/menu`,
    );

    expect(response.status).toBe(200);
    const { restaurant, categories } = response.body.data;
    expect(restaurant).toEqual({
      slug: fixtureA.restaurant.slug,
      name: 'Restaurante a',
      logoUrl: null,
      primaryColor: '#123456',
      secondaryColor: null,
    });
    expect(response.body.data.features).toEqual({ realtime: true, productModal: true });
    expect(categories).toHaveLength(1);
    expect(categories[0].products).toEqual([
      {
        id: expect.any(String),
        name: 'Disponível a',
        shortDescription: null,
        detailedDescription: null,
        price: '12.50',
        imageUrl: `/uploads/restaurants/${fixtureA.restaurant.id}/products/fixture.png`,
      },
    ]);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('restaurantId');
    expect(body).not.toContain('isAvailable');
    expect(body).not.toContain('isActive');
    expect(body).not.toContain('Disponível b');
  });

  it('retorna 404 para restaurante inexistente', async () => {
    const response = await request(app).get('/api/v1/public/restaurants/nao-existe-123/menu');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('retorna 400 para identificador inválido', async () => {
    const response = await request(app).get('/api/v1/public/restaurants/Slug_Invalido/menu');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('integridade multi-tenant no banco', () => {
  it('impede produto de um restaurante em categoria de outro restaurante', async () => {
    await expect(
      prisma.product.create({
        data: {
          restaurantId: fixtureB.restaurant.id,
          categoryId: fixtureA.category.id,
          name: 'Produto cruzado',
          price: '1.00',
        },
      }),
    ).rejects.toThrow();
  });
});

describe('GET /api/v1/public/restaurants/:slug/events (SSE)', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  });

  afterAll(() => {
    server.closeAllConnections();
    server.close();
  });

  it('entrega eventos somente ao restaurante correspondente', async () => {
    const streamA = await openEventStream(
      `${baseUrl}/public/restaurants/${fixtureA.restaurant.slug}/events`,
    );
    const streamB = await openEventStream(
      `${baseUrl}/public/restaurants/${fixtureB.restaurant.slug}/events`,
    );

    try {
      expect(streamA.response.headers.get('content-type')).toContain('text/event-stream');
      await streamA.waitFor('ready');
      await streamB.waitFor('ready');

      publishMenuUpdated(fixtureA.restaurant.id);

      const event = await streamA.waitFor('menu.updated');
      expect(event.data).toEqual({ type: 'menu.updated', at: expect.any(String) });
      await sleep(200);
      expect(streamB.events.some((e) => e.event === 'menu.updated')).toBe(false);
    } finally {
      streamA.close();
      streamB.close();
    }

    await waitUntil(() => countMenuSubscribers(fixtureA.restaurant.id) === 0);
  });

  it('retorna 404 em JSON para restaurante inexistente', async () => {
    const response = await fetch(`${baseUrl}/public/restaurants/nao-existe-123/events`);

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('sem atualização automática, recusa o restaurante ativo e aceita o suspenso', async () => {
    const restaurantId = fixtureB.restaurant.id;
    const url = `${baseUrl}/public/restaurants/${fixtureB.restaurant.slug}/events`;
    await prisma.restaurantFeature.create({
      data: { restaurantId, feature: 'REALTIME', enabled: false },
    });
    try {
      const active = await fetch(url);
      expect(active.status).toBe(403);

      // Suspenso: a conexão fica aberta para a reativação chegar ao cardápio aberto.
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { status: 'SUSPENDED' },
      });
      const stream = await openEventStream(url);
      try {
        expect(stream.response.status).toBe(200);
        await stream.waitFor('ready');
        expect(countMenuSubscribers(restaurantId)).toBe(1);
      } finally {
        stream.close();
      }
      await waitUntil(() => countMenuSubscribers(restaurantId) === 0);
    } finally {
      await prisma.restaurant.update({ where: { id: restaurantId }, data: { status: 'ACTIVE' } });
      await prisma.restaurantFeature.deleteMany({ where: { restaurantId } });
    }
  });

  it('não deixa assinatura nem heartbeat se o cliente desiste durante a inscrição', async () => {
    const res = Object.assign(new EventEmitter(), {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
    });
    const req = { validated: { params: { slug: fixtureA.restaurant.slug } } };

    const pending = streamMenuEvents(req, res);
    // A conexão cai enquanto a inscrição ainda consulta o banco.
    res.emit('close');
    await pending;

    expect(countMenuSubscribers(fixtureA.restaurant.id)).toBe(0);
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });
});

async function openEventStream(url) {
  const controller = new AbortController();
  const response = await fetch(url, { signal: controller.signal });
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const events = [];
  let buffer = '';

  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const parsed = parseEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          if (parsed) events.push(parsed);
        }
      }
    } catch {
      // Stream abortado pelo teste.
    }
  })();

  return {
    response,
    events,
    close: () => controller.abort(),
    async waitFor(eventName) {
      await waitUntil(() => events.some((e) => e.event === eventName));
      return events.find((e) => e.event === eventName);
    },
  };
}

function parseEvent(raw) {
  const lines = raw.split('\n');
  const event = lines.find((line) => line.startsWith('event: '))?.slice(7);
  const data = lines.find((line) => line.startsWith('data: '))?.slice(6);
  return event ? { event, data: data ? JSON.parse(data) : null } : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(condition, timeoutMs = 3_000) {
  const startedAt = Date.now();
  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error('Tempo esgotado aguardando condição.');
    await sleep(20);
  }
}
