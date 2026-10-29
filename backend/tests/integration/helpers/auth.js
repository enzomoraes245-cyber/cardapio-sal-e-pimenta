import { randomBytes } from 'node:crypto';
import { prisma } from '../../../src/config/database.js';
import { hashSessionToken } from '../../../src/modules/auth/auth.service.js';
import { hashPassword } from '../../../src/shared/utils/password.js';

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
