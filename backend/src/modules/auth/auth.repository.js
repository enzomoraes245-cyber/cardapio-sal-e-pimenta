import { prisma } from '../../config/database.js';

export function findSessionByTokenHash(tokenHash) {
  return prisma.adminSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      adminUser: { select: { id: true, restaurantId: true } },
    },
  });
}
