import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { createAdminFixture } from './helpers/auth.js';
import { createRestaurantFixture, deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
const PASSWORD = 'senha-de-teste-123';
let fixture;
let email;

beforeAll(async () => {
  fixture = await createRestaurantFixture('auth');
  email = `admin-${randomUUID()}@teste.local`;
  await createAdminFixture(fixture.restaurant.id, { email, password: PASSWORD });
});

afterAll(async () => {
  await deleteRestaurantFixtures([fixture.restaurant.id]);
  await prisma.$disconnect();
});

function login(body) {
  return request(app).post('/api/v1/auth/login').send(body);
}

describe('POST /api/v1/auth/login', () => {
  it('abre sessão com cookie HttpOnly e identifica o restaurante (CA-001)', async () => {
    const response = await login({ email: email.toUpperCase(), password: PASSWORD });

    expect(response.status).toBe(200);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toMatch(/^cd_session=/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie.split(';')[0]);
    expect(me.status).toBe(200);
    expect(me.body.data.restaurant).toEqual({
      id: fixture.restaurant.id,
      slug: fixture.restaurant.slug,
      name: fixture.restaurant.name,
    });
    expect(JSON.stringify(me.body)).not.toContain('passwordHash');
  });

  it('recusa senha errada e e-mail inexistente com a mesma mensagem (CA-002)', async () => {
    const wrongPassword = await login({ email, password: 'senha-errada' });
    const unknownEmail = await login({ email: 'ninguem@teste.local', password: PASSWORD });

    for (const response of [wrongPassword, unknownEmail]) {
      expect(response.status).toBe(401);
      expect(response.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha inválidos.',
      });
      expect(response.headers['set-cookie']).toBeUndefined();
    }
  });

  it('valida os campos obrigatórios', async () => {
    const response = await login({ email: 'nao-e-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('bloqueia após 10 tentativas falhas do mesmo e-mail', async () => {
    const target = `alvo-${randomUUID()}@teste.local`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await login({ email: target, password: 'x' });
      expect(response.status).toBe(401);
    }

    const blocked = await login({ email: target, password: 'x' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });

  it('recusa escrita vinda de outra origem', async () => {
    const response = await login({ email, password: PASSWORD }).set(
      'Origin',
      'https://site-malicioso.example',
    );

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN_ORIGIN');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('encerra a sessão no servidor', async () => {
    const loginResponse = await login({ email, password: PASSWORD });
    const cookie = loginResponse.headers['set-cookie'][0].split(';')[0];

    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(logout.status).toBe(204);

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(401);
  });
});
