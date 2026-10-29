import { Prisma } from '@prisma/client';
import { publishMenuUpdated } from '../../../shared/events/menu-events.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import { todayUtc, toIsoDate } from '../../../shared/utils/dates.js';
import { hashPassword } from '../../../shared/utils/password.js';
import {
  toFeatureEntries,
  toFeatureFlags,
  toFeatureRows,
} from '../../restaurants/restaurant-features.js';
import * as restaurantRepository from './platform-restaurant.repository.js';

const NOT_FOUND_MESSAGE = 'Restaurante não encontrado.';

function toSummary({ _count, subscription, features, ...restaurant }) {
  return {
    ...restaurant,
    subscription: subscription && {
      monthlyAmount: subscription.monthlyAmount.toFixed(2),
      dueDay: subscription.dueDay,
      startedAt: toIsoDate(subscription.startedAt),
    },
    features: toFeatureFlags(features),
    overdueInvoices: _count.invoices,
  };
}

/** Converte violação de unicidade (slug ou e-mail) em 409 com o campo correspondente. */
function rethrowUniqueConflict(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String(error.meta?.target ?? '');
    if (target.includes('slug')) {
      throw new ConflictError('Este endereço (slug) já está em uso.', 'SLUG_TAKEN', [
        { source: 'body', path: 'slug', message: 'Este endereço já está em uso.' },
      ]);
    }
    if (target.includes('email')) {
      throw new ConflictError('Este e-mail já está cadastrado.', 'EMAIL_TAKEN', [
        { source: 'body', path: 'admin.email', message: 'Este e-mail já está cadastrado.' },
      ]);
    }
  }
  throw error;
}

export async function listRestaurants() {
  const restaurants = await restaurantRepository.listRestaurants(todayUtc());
  return restaurants.map(toSummary);
}

export async function getRestaurant(id) {
  const restaurant = await restaurantRepository.findRestaurant(id, todayUtc());
  if (!restaurant) throw new NotFoundError(NOT_FOUND_MESSAGE);
  const { adminUsers, ...summary } = restaurant;
  return { ...toSummary(summary), admins: adminUsers };
}

/** Cadastra restaurante, primeiro administrador, assinatura e módulos (DEC-006, item 1). */
export async function createRestaurant({ slug, name, admin, subscription, features }) {
  const { password, ...adminData } = admin;
  const passwordHash = await hashPassword(password);
  try {
    const { id } = await restaurantRepository.createRestaurant({
      slug,
      name,
      admin: { ...adminData, passwordHash },
      subscription: { ...subscription, startedAt: todayUtc() },
      // O restaurantId é preenchido pela relação aninhada.
      featureRows: toFeatureEntries(features),
    });
    return getRestaurant(id);
  } catch (error) {
    return rethrowUniqueConflict(error);
  }
}

async function updateAndNotify(id, data) {
  try {
    await restaurantRepository.updateRestaurant(id, data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError(NOT_FOUND_MESSAGE);
    }
    throw error;
  }
  publishMenuUpdated(id);
  return getRestaurant(id);
}

export function updateRestaurant(id, { name }) {
  return updateAndNotify(id, { name });
}

/** Suspende retaguarda e cardápio público; os cardápios abertos são avisados (DEC-006, item 3). */
export function suspendRestaurant(id, { reason }) {
  return updateAndNotify(id, {
    status: 'SUSPENDED',
    suspendedAt: new Date(),
    suspensionReason: reason,
  });
}

export function reactivateRestaurant(id) {
  return updateAndNotify(id, { status: 'ACTIVE', suspendedAt: null, suspensionReason: null });
}

/** Libera ou bloqueia os módulos do restaurante (DEC-006, item 4). */
export async function updateFeatures(id, features) {
  await getRestaurant(id);
  await restaurantRepository.replaceFeatures(id, toFeatureRows(id, features));
  publishMenuUpdated(id);
  return getRestaurant(id);
}

export async function createAdmin(restaurantId, { password, ...admin }) {
  await getRestaurant(restaurantId);
  try {
    return await restaurantRepository.createAdmin(restaurantId, {
      ...admin,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    return rethrowUniqueConflict(error);
  }
}

export async function resetAdminPassword(restaurantId, adminId, { password }) {
  const updated = await restaurantRepository.updateAdminPassword(
    restaurantId,
    adminId,
    await hashPassword(password),
  );
  if (!updated) throw new NotFoundError('Administrador não encontrado.');
}
