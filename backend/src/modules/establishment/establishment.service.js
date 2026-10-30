import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { changedFields } from '../../shared/utils/changes.js';
import { AUDIT_ACTIONS, restaurantAdminActor } from '../audit/audit.actions.js';
import { recordAuditEvent } from '../audit/audit.repository.js';
import * as establishmentRepository from './establishment.repository.js';

function toEstablishment(restaurant) {
  return { ...restaurant, publicUrl: `${env.APP_PUBLIC_URL}/cardapio/${restaurant.slug}` };
}

/** Dados do estabelecimento (sempre disponível, independente do módulo de personalização). */
export async function getEstablishment(restaurantId) {
  const restaurant = await establishmentRepository.findEstablishment(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurante não encontrado.');
  return toEstablishment(restaurant);
}

/**
 * Nome e contato, alterados pelo próprio restaurante. Não toca em slug, assinatura, situação
 * ou módulos. A alteração fica no histórico; o nome novo chega aos cardápios abertos.
 */
export async function updateEstablishment(auth, { name, contactPhone, contactEmail }) {
  const restaurantId = auth.restaurantId;
  const { nameChanged } = await prisma.$transaction(async (tx) => {
    const current = await establishmentRepository.findEstablishment(restaurantId, tx);
    if (!current) throw new NotFoundError('Restaurante não encontrado.');
    const next = {
      name,
      contactPhone: contactPhone ?? null,
      contactEmail: contactEmail ?? null,
    };
    const changes = changedFields(current, next);
    if (Object.keys(changes).length === 0) return { nameChanged: false };

    await establishmentRepository.updateEstablishment(tx, restaurantId, next);
    await recordAuditEvent(tx, {
      actor: restaurantAdminActor(auth),
      restaurantId,
      action: AUDIT_ACTIONS.ESTABLISHMENT_UPDATED,
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      metadata: { changes },
    });
    return { nameChanged: 'name' in changes };
  });
  if (nameChanged) publishMenuUpdated(restaurantId);
  return getEstablishment(restaurantId);
}
