import { prisma } from '../../config/database.js';
import { recordAuditEvent } from '../audit/audit.repository.js';

/** Onde ficam as contas de cada área: retaguarda (restaurant) e backoffice (platform). */
const AUDIENCES = {
  restaurant: {
    ownerField: 'adminUserId',
    findByEmail: (email) =>
      prisma.adminUser.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, disabledAt: true, restaurantId: true },
      }),
  },
  platform: {
    ownerField: 'platformAdminId',
    findByEmail: (email) =>
      prisma.platformAdmin.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      }),
  },
};

export function findAccountByEmail(audience, email) {
  return AUDIENCES[audience].findByEmail(email);
}

/**
 * Registra um novo pedido. Pedidos anteriores ainda não usados do mesmo usuário deixam de
 * valer (só o link mais recente funciona) e os vencidos de todos os usuários são removidos.
 */
export function createResetToken(audience, { ownerId, tokenHash, expiresAt, now }) {
  const { ownerField } = AUDIENCES[audience];
  return prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { [ownerField]: ownerId, usedAt: null } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.passwordResetToken.create({
      data: { [ownerField]: ownerId, tokenHash, expiresAt },
      select: { id: true },
    }),
  ]);
}

export function findResetToken(tokenHash) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      usedAt: true,
      adminUser: { select: { id: true, name: true, disabledAt: true, restaurantId: true } },
      platformAdmin: { select: { id: true, name: true } },
    },
  });
}

/**
 * Aplica a nova senha numa única transação: consome o token (uso único, também sob
 * concorrência), encerra todas as sessões do usuário e registra no histórico.
 * Retorna false se o token já tiver sido usado ou vencido nesse meio-tempo.
 */
export function consumeResetToken({ audience, tokenId, ownerId, passwordHash, now, audit }) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: tokenId, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count === 0) return false;

    if (audience === 'restaurant') {
      await tx.adminUser.update({ where: { id: ownerId }, data: { passwordHash } });
      await tx.adminSession.deleteMany({ where: { adminUserId: ownerId } });
    } else {
      await tx.platformAdmin.update({ where: { id: ownerId }, data: { passwordHash } });
      await tx.platformSession.deleteMany({ where: { platformAdminId: ownerId } });
    }
    await recordAuditEvent(tx, audit);
    return true;
  });
}
