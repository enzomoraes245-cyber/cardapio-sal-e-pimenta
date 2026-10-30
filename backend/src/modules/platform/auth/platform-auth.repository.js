import { prisma } from '../../../config/database.js';
import { recordAuditEvent } from '../../audit/audit.repository.js';

export function findAdminByEmail(email) {
  return prisma.platformAdmin.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
}

export function findAdminPasswordHash(id) {
  return prisma.platformAdmin.findUnique({ where: { id }, select: { passwordHash: true } });
}

export function findAdminProfile(id) {
  return prisma.platformAdmin.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}

export function findSessionByTokenHash(tokenHash) {
  return prisma.platformSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      platformAdminId: true,
      platformAdmin: { select: { name: true } },
    },
  });
}

export function createSession({ platformAdminId, tokenHash, expiresAt }) {
  return prisma.platformSession.create({ data: { platformAdminId, tokenHash, expiresAt } });
}

export function deleteSessionById(id) {
  return prisma.platformSession.deleteMany({ where: { id } });
}

export function deleteSessionByTokenHash(tokenHash) {
  return prisma.platformSession.deleteMany({ where: { tokenHash } });
}

/** Remove sessões vencidas (limpeza oportunista a cada login). */
export function deleteExpiredSessions(now) {
  return prisma.platformSession.deleteMany({ where: { expiresAt: { lte: now } } });
}

/** Troca a senha do operador, encerra as outras sessões dele e registra no histórico. */
export function changeOwnPassword({ platformAdminId, passwordHash, keepSessionId, audit }) {
  return prisma.$transaction(async (tx) => {
    await tx.platformAdmin.update({ where: { id: platformAdminId }, data: { passwordHash } });
    await tx.platformSession.deleteMany({
      where: { platformAdminId, id: { not: keepSessionId } },
    });
    await recordAuditEvent(tx, audit);
  });
}
