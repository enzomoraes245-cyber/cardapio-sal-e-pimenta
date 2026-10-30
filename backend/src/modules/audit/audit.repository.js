import { prisma } from '../../config/database.js';

/**
 * Grava um evento no histórico. `client` é o Prisma ou a transação em andamento: o registro
 * só existe se a alteração correspondente for confirmada.
 */
export function recordAuditEvent(
  client,
  { actor, restaurantId, action, entityType, entityId, reason, metadata },
) {
  return client.auditEvent.create({
    data: {
      actorType: actor.type,
      actorId: actor.id ?? null,
      actorName: actor.name ?? null,
      restaurantId: restaurantId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      reason: reason ?? null,
      metadata: metadata ?? undefined,
    },
    select: { id: true },
  });
}

const EVENT_SELECT = {
  id: true,
  occurredAt: true,
  actorType: true,
  actorName: true,
  action: true,
  entityType: true,
  entityId: true,
  reason: true,
  metadata: true,
  restaurant: { select: { id: true, name: true, slug: true } },
};

/** Histórico em ordem decrescente, opcionalmente de um restaurante. */
export async function listAuditEvents({ restaurantId, skip, take }) {
  const where = restaurantId ? { restaurantId } : {};
  const [items, total] = await prisma.$transaction([
    prisma.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: EVENT_SELECT,
    }),
    prisma.auditEvent.count({ where }),
  ]);
  return { items, total };
}
