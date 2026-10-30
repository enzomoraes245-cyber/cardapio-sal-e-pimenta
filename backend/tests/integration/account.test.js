import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { takeLoggedMails } from '../../src/shared/mail/mailer.js';
import {
  createAdminFixture,
  createPlatformAdminFixture,
  createSessionCookie,
} from './helpers/auth.js';
import { createRestaurantFixture, deleteRestaurantFixtures } from './helpers/fixtures.js';

const app = createApp();
const PASSWORD = 'senha-de-teste-123';
let fixture;
const platformAdminIds = [];

beforeAll(async () => {
  fixture = await createRestaurantFixture('conta');
});

beforeEach(() => {
  takeLoggedMails();
});

afterAll(async () => {
  await deleteRestaurantFixtures([fixture.restaurant.id]);
  await prisma.platformAdmin.deleteMany({ where: { id: { in: platformAdminIds } } });
  await prisma.$disconnect();
});

async function newAdmin() {
  const email = `conta-${randomUUID()}@teste.local`;
  const admin = await createAdminFixture(fixture.restaurant.id, { email, password: PASSWORD });
  return { admin, email, cookie: await createSessionCookie(admin.id) };
}

const loginAs = (email, password) =>
  request(app).post('/api/v1/auth/login').send({ email, password });
const me = (cookie) => request(app).get('/api/v1/auth/me').set('Cookie', cookie);
const changePassword = (cookie, body) =>
  request(app).put('/api/v1/auth/password').set('Cookie', cookie).send(body);

/** Extrai o token do link enviado por e-mail (driver "log"). */
function tokenFromMail(mail) {
  const match = mail.text.match(/#token=([\w-]+)/);
  return match?.[1];
}

describe('PUT /api/v1/auth/password (troca da própria senha)', () => {
  it('exige a senha atual correta e uma nova senha diferente', async () => {
    const { cookie } = await newAdmin();

    const wrong = await changePassword(cookie, {
      currentPassword: 'errada-123',
      newPassword: 'nova-senha-123',
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.details).toEqual([
      expect.objectContaining({ path: 'currentPassword' }),
    ]);

    const same = await changePassword(cookie, { currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(same.status).toBe(400);
    expect(same.body.error.details[0].path).toBe('newPassword');

    const short = await changePassword(cookie, { currentPassword: PASSWORD, newPassword: '123' });
    expect(short.status).toBe(400);
  });

  it('troca a senha, mantém a sessão atual, encerra as outras e registra no histórico', async () => {
    const { admin, email, cookie } = await newAdmin();
    const otherSession = await createSessionCookie(admin.id);

    const response = await changePassword(cookie, {
      currentPassword: PASSWORD,
      newPassword: 'nova-senha-123',
    });

    expect(response.status).toBe(204);
    expect((await me(cookie)).status).toBe(200);
    expect((await me(otherSession)).status).toBe(401);
    expect((await loginAs(email, PASSWORD)).status).toBe(401);
    expect((await loginAs(email, 'nova-senha-123')).status).toBe(200);

    const events = await prisma.auditEvent.findMany({
      where: { entityId: admin.id, action: 'PASSWORD_CHANGED' },
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      actorType: 'RESTAURANT_ADMIN',
      actorId: admin.id,
      restaurantId: fixture.restaurant.id,
    });
  });

  it('exige sessão', async () => {
    const response = await request(app)
      .put('/api/v1/auth/password')
      .send({ currentPassword: PASSWORD, newPassword: 'nova-senha-123' });
    expect(response.status).toBe(401);
  });
});

describe('administrador bloqueado', () => {
  it('não entra (403 só depois da senha correta) e perde a sessão aberta', async () => {
    const { admin, email, cookie } = await newAdmin();
    await prisma.adminUser.update({ where: { id: admin.id }, data: { disabledAt: new Date() } });

    const wrongPassword = await loginAs(email, 'errada-123');
    expect(wrongPassword.status).toBe(401);

    const blocked = await loginAs(email, PASSWORD);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('USER_DISABLED');
    expect(blocked.headers['set-cookie']).toBeUndefined();

    expect((await me(cookie)).status).toBe(401);
    expect(await prisma.adminSession.count({ where: { adminUserId: admin.id } })).toBe(0);
  });
});

describe('recuperação de senha por e-mail (retaguarda)', () => {
  it('informa que a recuperação está disponível', async () => {
    const response = await request(app).get('/api/v1/auth/password/recovery');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      emailRecovery: true,
      developmentMailLog: true,
      linkTtlMinutes: 60,
    });
  });

  it('responde igual para e-mail inexistente e não envia nada', async () => {
    const response = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: `ninguem-${randomUUID()}@teste.local` });

    expect(response.status).toBe(202);
    expect(takeLoggedMails()).toHaveLength(0);
  });

  it('envia o link, redefine a senha uma única vez e encerra as sessões', async () => {
    const { admin, email, cookie } = await newAdmin();

    const forgot = await request(app).post('/api/v1/auth/password/forgot').send({ email });
    expect(forgot.status).toBe(202);
    const [mail] = takeLoggedMails();
    expect(mail.to).toBe(email);
    expect(mail.text).toContain('/admin/redefinir-senha#token=');
    const token = tokenFromMail(mail);
    // Só o hash fica no banco.
    expect(await prisma.passwordResetToken.count({ where: { tokenHash: token } })).toBe(0);

    const reset = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ token, password: 'senha-redefinida-1' });
    expect(reset.status).toBe(204);
    expect((await me(cookie)).status).toBe(401);
    expect((await loginAs(email, 'senha-redefinida-1')).status).toBe(200);

    const reuse = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ token, password: 'outra-senha-123' });
    expect(reuse.status).toBe(400);
    expect(reuse.body.error.code).toBe('INVALID_RESET_TOKEN');

    const events = await prisma.auditEvent.findMany({
      where: { entityId: admin.id, action: 'PASSWORD_RESET_BY_EMAIL' },
    });
    expect(events).toHaveLength(1);
  });

  it('só o link mais recente vale; link vencido ou de outra área é recusado', async () => {
    const { admin, email } = await newAdmin();

    await request(app).post('/api/v1/auth/password/forgot').send({ email });
    await request(app).post('/api/v1/auth/password/forgot').send({ email });
    const [first, second] = takeLoggedMails();

    const old = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ token: tokenFromMail(first), password: 'senha-redefinida-2' });
    expect(old.status).toBe(400);

    // Um link da retaguarda não serve no backoffice.
    const otherArea = await request(app)
      .post('/api/v1/platform/auth/password/reset')
      .send({ token: tokenFromMail(second), password: 'senha-redefinida-2' });
    expect(otherArea.status).toBe(400);

    await prisma.passwordResetToken.updateMany({
      where: { adminUserId: admin.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ token: tokenFromMail(second), password: 'senha-redefinida-2' });
    expect(expired.status).toBe(400);
  });

  it('não envia link para administrador bloqueado', async () => {
    const { admin, email } = await newAdmin();
    await prisma.adminUser.update({ where: { id: admin.id }, data: { disabledAt: new Date() } });

    const response = await request(app).post('/api/v1/auth/password/forgot').send({ email });

    expect(response.status).toBe(202);
    expect(takeLoggedMails()).toHaveLength(0);
  });

  it('limita os pedidos repetidos para o mesmo e-mail', async () => {
    const email = `limite-${randomUUID()}@teste.local`;
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app).post('/api/v1/auth/password/forgot').send({ email });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5)).toEqual([202, 202, 202, 202, 202]);
    expect(statuses[5]).toBe(429);
  });
});

describe('conta do operador do backoffice', () => {
  it('troca a própria senha e recupera por e-mail', async () => {
    const operator = await createPlatformAdminFixture();
    platformAdminIds.push(operator.platformAdmin.id);

    const changed = await request(app)
      .put('/api/v1/platform/auth/password')
      .set('Cookie', operator.cookie)
      .send({ currentPassword: 'senha-de-teste-123', newPassword: 'operador-novo-123' });
    expect(changed.status).toBe(204);

    const forgot = await request(app)
      .post('/api/v1/platform/auth/password/forgot')
      .send({ email: operator.platformAdmin.email });
    expect(forgot.status).toBe(202);
    const [mail] = takeLoggedMails();
    expect(mail.text).toContain('/backoffice/redefinir-senha#token=');

    const reset = await request(app)
      .post('/api/v1/platform/auth/password/reset')
      .send({ token: tokenFromMail(mail), password: 'operador-final-123' });
    expect(reset.status).toBe(204);

    const login = await request(app)
      .post('/api/v1/platform/auth/login')
      .send({ email: operator.platformAdmin.email, password: 'operador-final-123' });
    expect(login.status).toBe(200);
    // A sessão antiga foi encerrada pela redefinição.
    const oldSession = await request(app)
      .get('/api/v1/platform/auth/me')
      .set('Cookie', operator.cookie);
    expect(oldSession.status).toBe(401);
  });
});
