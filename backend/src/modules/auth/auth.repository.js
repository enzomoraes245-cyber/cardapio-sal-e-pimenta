import { prisma } from '../../config/database.js';

export function findSessionByTokenHash(tokenHash) {
  return prisma.adminSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      adminUser: {
        select: { id: true, restaurantId: true, restaurant: { select: { status: true } } },
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
      restaurant: { select: { status: true } },
    },
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
