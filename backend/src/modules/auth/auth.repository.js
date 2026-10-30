import { prisma } from '../../config/database.js';
import { recordAuditEvent } from '../audit/audit.repository.js';

export function findSessionByTokenHash(tokenHash) {
  return prisma.adminSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      adminUser: {
        select: {
          id: true,
          name: true,
          restaurantId: true,
          disabledAt: true,
          restaurant: { select: { status: true } },
        },
      },
    },
  });
}

export function findAdminByEmail(email) {
  return prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      restaurantId: true,
      passwordHash: true,
      disabledAt: true,
      restaurant: { select: { status: true } },
    },
  });
}

export function findAdminPasswordHash(adminUserId) {
  return prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { passwordHash: true },
  });
}

export function createSession({ adminUserId, tokenHash, expiresAt }) {
  return prisma.adminSession.create({
    data: { adminUserId, tokenHash, expiresAt },
    select: { id: true },
  });
}

export function deleteSessionById(id) {
  return prisma.adminSession.deleteMany({ where: { id } });
}

export function deleteSessionByTokenHash(tokenHash) {
  return prisma.adminSession.deleteMany({ where: { tokenHash } });
}

/** Remove sessões vencidas (limpeza oportunista a cada login). */
export function deleteExpiredSessions(now) {
  return prisma.adminSession.deleteMany({ where: { expiresAt: { lte: now } } });
}

/**
 * Troca a senha do próprio administrador: encerra as outras sessões (a atual continua) e
 * registra no histórico, tudo na mesma transação.
 */
export function changeOwnPassword({ adminUserId, passwordHash, keepSessionId, audit }) {
  return prisma.$transaction(async (tx) => {
    await tx.adminUser.update({ where: { id: adminUserId }, data: { passwordHash } });
    await tx.adminSession.deleteMany({ where: { adminUserId, id: { not: keepSessionId } } });
    await recordAuditEvent(tx, audit);
  });
}

export function findAdminProfile(adminUserId) {
  return prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: {
      id: true,
      name: true,
      email: true,
      restaurant: { select: { id: true, slug: true, name: true } },
    },
  });
}
