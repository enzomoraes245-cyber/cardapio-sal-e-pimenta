import { randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '../../../src/config/database.js';
import { hashSessionToken } from '../../../src/shared/utils/session-token.js';
import { hashPassword } from '../../../src/shared/utils/password.js';
import { createRestaurantFixture } from './fixtures.js';

/** Restaurante de teste com categoria, produtos, administrador e cookie de sessão. */
export async function createTenantFixture(label) {
  const fixture = await createRestaurantFixture(label);
  const admin = await createAdminFixture(fixture.restaurant.id, {
    email: `admin-${label}-${randomUUID()}@teste.local`,
  });
  return { ...fixture, admin, cookie: await createSessionCookie(admin.id) };
}

/** Cria um administrador para o restaurante informado. */
export async function createAdminFixture(restaurantId, { email, password = 'senha-de-teste-123' }) {
  return prisma.adminUser.create({
    data: {
      restaurantId,
      email,
      name: 'Admin de teste',
      passwordHash: await hashPassword(password),
    },
  });
}

/** Operador do backoffice com sessão aberta. Retorna { platformAdmin, cookie }. */
export async function createPlatformAdminFixture() {
  const platformAdmin = await prisma.platformAdmin.create({
    data: {
      email: `operador-${randomUUID()}@teste.local`,
      name: 'Operador de teste',
      passwordHash: await hashPassword('senha-de-teste-123'),
    },
  });
  const token = randomBytes(32).toString('base64url');
  await prisma.platformSession.create({
    data: {
      platformAdminId: platformAdmin.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return { platformAdmin, cookie: `cd_platform_session=${token}` };
}

/**
 * Abre uma sessão diretamente no banco (sem passar pelo login) e devolve o cabeçalho Cookie.
 * Mantém os testes de módulos administrativos rápidos.
 */
export async function createSessionCookie(adminUserId) {
  const token = randomBytes(32).toString('base64url');
  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return `cd_session=${token}`;
}
