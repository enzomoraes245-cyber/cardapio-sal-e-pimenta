import { prisma } from '../../../config/database.js';

export function findAdminByEmail(email) {
  return prisma.platformAdmin.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
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
    select: { id: true, expiresAt: true, platformAdminId: true },
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
