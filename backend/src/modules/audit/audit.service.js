import * as auditRepository from './audit.repository.js';

function toEvent({ actorType, actorName, ...event }) {
  return { ...event, actor: { type: actorType, name: actorName } };
}

/** Histórico de ações relevantes, do mais recente para o mais antigo. */
export async function listAuditEvents({ restaurantId, page, pageSize }) {
  const { items, total } = await auditRepository.listAuditEvents({
    restaurantId,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { items: items.map(toEvent), total, page, pageSize };
}
