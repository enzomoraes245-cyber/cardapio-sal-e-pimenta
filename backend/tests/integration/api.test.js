import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('confirma que a API e o PostgreSQL estão acessíveis', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ status: 'ok', database: 'up' });
  });
});

describe('rotas inexistentes', () => {
  it('retornam 404 no formato JSON padronizado', async () => {
    const response = await request(app).get('/api/v1/nao-existe');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'ROUTE_NOT_FOUND', message: expect.any(String) },
    });
  });
});

describe('rotas administrativas', () => {
  it('exigem autenticação', async () => {
    const response = await request(app).get('/api/v1/admin/categories');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejeitam cookie de sessão inexistente', async () => {
    const response = await request(app)
      .get('/api/v1/admin/categories')
      .set('Cookie', `cd_session=${'x'.repeat(64)}`);

    expect(response.status).toBe(401);
  });
});
