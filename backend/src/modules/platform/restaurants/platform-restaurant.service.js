import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import { publishMenuUpdated } from '../../../shared/events/menu-events.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import { changedFields } from '../../../shared/utils/changes.js';
import { businessToday, parseIsoDate, toIsoDate } from '../../../shared/utils/dates.js';
import { createOnce } from '../../../shared/utils/idempotency.js';
import { hashPassword } from '../../../shared/utils/password.js';
import { AUDIT_ACTIONS } from '../../audit/audit.actions.js';
import { recordAuditEvent } from '../../audit/audit.repository.js';
import {
  toFeatureEntries,
  toFeatureFlags,
  toFeatureRows,
} from '../../restaurants/restaurant-features.js';
import * as restaurantRepository from './platform-restaurant.repository.js';

const NOT_FOUND_MESSAGE = 'Restaurante não encontrado.';
const ADMIN_NOT_FOUND_MESSAGE = 'Administrador não encontrado.';

function toAdmin(admin) {
  return { ...admin, blocked: Boolean(admin.disabledAt) };
}

function toRestaurant({ _count, subscription, features, adminUsers, ...restaurant }, overdue) {
  return {
    ...restaurant,
    subscription: subscription && {
      monthlyAmount: subscription.monthlyAmount.toFixed(2),
      dueDay: subscription.dueDay,
      startedAt: toIsoDate(subscription.startedAt),
    },
    features: toFeatureFlags(features),
    adminCount: _count.adminUsers,
    // "Vencidas": mensalidades em aberto com vencimento anterior a hoje (fuso do negócio).
    overdueInvoices: overdue?._count._all ?? 0,
    overdueAmount: (overdue?._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
  };
}

/** Converte violação de unicidade (slug ou e-mail) em 409 apontando o campo. */
function rethrowUniqueConflict(error, { emailPath }) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String(error.meta?.target ?? '');
    if (target.includes('slug')) {
      throw new ConflictError('Este endereço (slug) já está em uso.', 'SLUG_TAKEN', [
        { source: 'body', path: 'slug', message: 'Este endereço já está em uso.' },
      ]);
    }
    if (target.includes('email')) {
      throw new ConflictError('Este e-mail já está cadastrado.', 'EMAIL_TAKEN', [
        { source: 'body', path: emailPath, message: 'Este e-mail já está cadastrado.' },
      ]);
    }
  }
  throw error;
}

async function notFoundOr(tx, id, conflict) {
  const exists = await tx.restaurant.findUnique({ where: { id }, select: { id: true } });
  return exists ? conflict : new NotFoundError(NOT_FOUND_MESSAGE);
}

export async function listRestaurants() {
  const [restaurants, overdue] = await Promise.all([
    restaurantRepository.listRestaurants(),
    restaurantRepository.overdueInvoicesByRestaurant(businessToday()),
  ]);
  const overdueById = new Map(overdue.map((row) => [row.restaurantId, row]));
  return restaurants.map((restaurant) => ({
    ...toRestaurant(restaurant, overdueById.get(restaurant.id)),
    primaryAdmin: restaurant.adminUsers[0] ? toAdmin(restaurant.adminUsers[0]) : null,
  }));
}

export async function getRestaurant(id) {
  const restaurant = await restaurantRepository.findRestaurant(id);
  if (!restaurant) throw new NotFoundError(NOT_FOUND_MESSAGE);
  const [overdue] = await restaurantRepository.overdueInvoicesByRestaurant(businessToday(), id);
  return { ...toRestaurant(restaurant, overdue), admins: restaurant.adminUsers.map(toAdmin) };
}

/**
 * Cadastra restaurante, primeiro administrador, assinatura e módulos (DEC-006, item 1).
 * Com Idempotency-Key, repetir o envio devolve o mesmo restaurante (`replayed`).
 */
export async function createRestaurant(data, { actor, idempotencyKey }) {
  const { slug, name, contactPhone, contactEmail, admin, subscription, features } = data;
  const { password, ...adminData } = admin;
  const { startedAt, ...plan } = subscription;
  const passwordHash = await hashPassword(password);

  try {
    const { result, replayed } = await createOnce(
      { key: idempotencyKey, scope: 'platform.restaurant.create', ownerId: actor.id },
      {
        create: async (tx) => {
          const created = await restaurantRepository.createRestaurant(tx, {
            slug,
            name,
            contact: { contactPhone: contactPhone ?? null, contactEmail: contactEmail ?? null },
            admin: { ...adminData, passwordHash },
            subscription: {
              ...plan,
              startedAt: startedAt ? parseIsoDate(startedAt) : businessToday(),
            },
            // O restaurantId é preenchido pela relação aninhada.
            featureRows: toFeatureEntries(features),
          });
          await recordAuditEvent(tx, {
            actor,
            restaurantId: created.id,
            action: AUDIT_ACTIONS.RESTAURANT_CREATED,
            entityType: 'RESTAURANT',
            entityId: created.id,
            metadata: { slug, name, monthlyAmount: plan.monthlyAmount, dueDay: plan.dueDay },
          });
          await recordAuditEvent(tx, {
            actor,
            restaurantId: created.id,
            action: AUDIT_ACTIONS.ADMIN_CREATED,
            entityType: 'ADMIN_USER',
            entityId: created.adminUsers[0].id,
            metadata: { name: adminData.name, email: adminData.email },
          });
          return created;
        },
        load: getRestaurant,
      },
    );
    return { restaurant: result, replayed };
  } catch (error) {
    return rethrowUniqueConflict(error, { emailPath: 'admin.email' });
  }
}

/** Dados cadastrais (nome e contato). O endereço público (slug) nunca muda. */
export async function updateRestaurant(id, { name, contactPhone, contactEmail }, actor) {
  const { nameChanged } = await prisma.$transaction(async (tx) => {
    const current = await tx.restaurant.findUnique({
      where: { id },
      select: { name: true, contactPhone: true, contactEmail: true },
    });
    if (!current) throw new NotFoundError(NOT_FOUND_MESSAGE);

    const next = {
      name,
      ...(contactPhone !== undefined && { contactPhone }),
      ...(contactEmail !== undefined && { contactEmail }),
    };
    const changes = changedFields(current, next);
    if (Object.keys(changes).length === 0) return { nameChanged: false };

    await restaurantRepository.updateRestaurant(tx, id, next);
    await recordAuditEvent(tx, {
      actor,
      restaurantId: id,
      action: AUDIT_ACTIONS.RESTAURANT_UPDATED,
      entityType: 'RESTAURANT',
      entityId: id,
      metadata: { changes },
    });
    return { nameChanged: 'name' in changes };
  });
  if (nameChanged) publishMenuUpdated(id);
  return getRestaurant(id);
}

/**
 * Suspende retaguarda e cardápio público (DEC-006, item 3), com motivo e autor no histórico.
 * Nada é apagado; os cardápios abertos são avisados.
 */
export async function suspendRestaurant(id, { reason }, actor) {
  await prisma.$transaction(async (tx) => {
    const changed = await restaurantRepository.changeStatus(tx, id, {
      from: 'ACTIVE',
      data: { status: 'SUSPENDED', suspendedAt: new Date(), suspensionReason: reason },
    });
    if (!changed) {
      throw await notFoundOr(
        tx,
        id,
        new ConflictError('Este restaurante já está suspenso.', 'INVALID_STATUS'),
      );
    }
    await recordAuditEvent(tx, {
      actor,
      restaurantId: id,
      action: AUDIT_ACTIONS.RESTAURANT_SUSPENDED,
      entityType: 'RESTAURANT',
      entityId: id,
      reason,
    });
  });
  publishMenuUpdated(id);
  return getRestaurant(id);
}

/** Reativa o restaurante; o histórico guarda o motivo e os dados da suspensão encerrada. */
export async function reactivateRestaurant(id, { reason }, actor) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.restaurant.findUnique({
      where: { id },
      select: { suspendedAt: true, suspensionReason: true },
    });
    if (!current) throw new NotFoundError(NOT_FOUND_MESSAGE);
    const changed = await restaurantRepository.changeStatus(tx, id, {
      from: 'SUSPENDED',
      data: { status: 'ACTIVE', suspendedAt: null, suspensionReason: null },
    });
    if (!changed) throw new ConflictError('Este restaurante não está suspenso.', 'INVALID_STATUS');
    await recordAuditEvent(tx, {
      actor,
      restaurantId: id,
      action: AUDIT_ACTIONS.RESTAURANT_REACTIVATED,
      entityType: 'RESTAURANT',
      entityId: id,
      reason,
      metadata: { suspendedAt: current.suspendedAt, suspensionReason: current.suspensionReason },
    });
  });
  publishMenuUpdated(id);
  return getRestaurant(id);
}

/** Libera ou bloqueia os módulos do restaurante (DEC-006, item 4). */
export async function updateFeatures(id, features, actor) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.restaurant.findUnique({
      where: { id },
      select: { features: { select: { feature: true, enabled: true } } },
    });
    if (!current) throw new NotFoundError(NOT_FOUND_MESSAGE);
    const changes = changedFields(toFeatureFlags(current.features), features);
    await restaurantRepository.replaceFeatures(tx, id, toFeatureRows(id, features));
    if (Object.keys(changes).length > 0) {
      await recordAuditEvent(tx, {
        actor,
        restaurantId: id,
        action: AUDIT_ACTIONS.FEATURES_UPDATED,
        entityType: 'RESTAURANT',
        entityId: id,
        metadata: { changes },
      });
    }
  });
  publishMenuUpdated(id);
  return getRestaurant(id);
}

export async function createAdmin(restaurantId, { password, ...admin }, actor) {
  const passwordHash = await hashPassword(password);
  try {
    return await prisma.$transaction(async (tx) => {
      const exists = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundError(NOT_FOUND_MESSAGE);
      const created = await restaurantRepository.createAdmin(tx, restaurantId, {
        ...admin,
        passwordHash,
      });
      await recordAuditEvent(tx, {
        actor,
        restaurantId,
        action: AUDIT_ACTIONS.ADMIN_CREATED,
        entityType: 'ADMIN_USER',
        entityId: created.id,
        metadata: { name: admin.name, email: admin.email },
      });
      return toAdmin(created);
    });
  } catch (error) {
    return rethrowUniqueConflict(error, { emailPath: 'email' });
  }
}

export async function updateAdmin(restaurantId, adminId, { name, email }, actor) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await restaurantRepository.findAdmin(restaurantId, adminId, tx);
      if (!current) throw new NotFoundError(ADMIN_NOT_FOUND_MESSAGE);
      const next = { ...(name !== undefined && { name }), ...(email !== undefined && { email }) };
      const changes = changedFields(current, next);
      if (Object.keys(changes).length === 0) return toAdmin(current);

      const updated = await restaurantRepository.updateAdmin(tx, adminId, next);
      await recordAuditEvent(tx, {
        actor,
        restaurantId,
        action: AUDIT_ACTIONS.ADMIN_UPDATED,
        entityType: 'ADMIN_USER',
        entityId: adminId,
        metadata: { changes },
      });
      return toAdmin(updated);
    });
  } catch (error) {
    return rethrowUniqueConflict(error, { emailPath: 'email' });
  }
}

/** Bloqueia (encerrando as sessões) ou libera o acesso de um administrador. */
export async function setAdminAccess(restaurantId, adminId, { blocked, reason }, actor) {
  return prisma.$transaction(async (tx) => {
    const current = await restaurantRepository.findAdmin(restaurantId, adminId, tx);
    if (!current) throw new NotFoundError(ADMIN_NOT_FOUND_MESSAGE);
    const changed = blocked
      ? await restaurantRepository.blockAdmin(tx, restaurantId, adminId, new Date())
      : await restaurantRepository.unblockAdmin(tx, restaurantId, adminId);
    if (!changed) {
      throw new ConflictError(
        blocked ? 'Este acesso já está bloqueado.' : 'Este acesso não está bloqueado.',
        'INVALID_STATUS',
      );
    }
    await recordAuditEvent(tx, {
      actor,
      restaurantId,
      action: blocked ? AUDIT_ACTIONS.ADMIN_BLOCKED : AUDIT_ACTIONS.ADMIN_UNBLOCKED,
      entityType: 'ADMIN_USER',
      entityId: adminId,
      reason,
      metadata: { name: current.name, email: current.email },
    });
    return toAdmin(await restaurantRepository.findAdmin(restaurantId, adminId, tx));
  });
}

export async function resetAdminPassword(restaurantId, adminId, { password }, actor) {
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const current = await restaurantRepository.findAdmin(restaurantId, adminId, tx);
    if (!current) throw new NotFoundError(ADMIN_NOT_FOUND_MESSAGE);
    await restaurantRepository.updateAdminPassword(tx, adminId, passwordHash);
    await recordAuditEvent(tx, {
      actor,
      restaurantId,
      action: AUDIT_ACTIONS.ADMIN_PASSWORD_RESET,
      entityType: 'ADMIN_USER',
      entityId: adminId,
      metadata: { name: current.name, email: current.email },
    });
  });
}
