import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { RestaurantSuspendedError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import {
  MAX_TOKEN_LENGTH,
  generateSessionToken,
  hashSessionToken,
  isPlausibleToken,
} from '../../shared/utils/session-token.js';
import { getRestaurantFeatures } from '../restaurants/restaurant-features.js';
import * as authRepository from './auth.repository.js';

const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';
const SUSPENDED_MESSAGE =
  'O acesso deste restaurante está suspenso. Entre em contato com o suporte da plataforma.';

// Hash de referência para comparar quando o e-mail não existe: o tempo de resposta não revela
// quais e-mails estão cadastrados.
let dummyHashPromise = null;
export function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString('hex'));
  return dummyHashPromise;
}

export function invalidCredentialsError() {
  const error = new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  error.code = 'INVALID_CREDENTIALS';
  return error;
}

/**
 * Valida as credenciais e abre uma sessão (RF-001, RF-002).
 * Restaurante suspenso é informado somente depois de validar a senha.
 */
export async function login(email, password) {
  const admin = await authRepository.findAdminByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? (await getDummyHash()),
  );

  if (!admin || !passwordMatches) throw invalidCredentialsError();
  if (admin.restaurant.status === 'SUSPENDED')
    throw new RestaurantSuspendedError(SUSPENDED_MESSAGE);

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  await authRepository.createSession({
    adminUserId: admin.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function logout(token) {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return;
  await authRepository.deleteSessionByTokenHash(hashSessionToken(token));
}

/**
 * Resolve o token do cookie em uma sessão ativa.
 * Retorna null para tokens malformados, inexistentes ou expirados (expirados são removidos).
 */
export async function resolveSession(token) {
  if (!isPlausibleToken(token)) return null;

  const session = await authRepository.findSessionByTokenHash(hashSessionToken(token));
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await authRepository.deleteSessionById(session.id);
    return null;
  }

  return {
    sessionId: session.id,
    adminUserId: session.adminUser.id,
    restaurantId: session.adminUser.restaurantId,
    restaurantStatus: session.adminUser.restaurant.status,
  };
}

/** Bloqueia operações administrativas de restaurante suspenso (DEC-006). */
export function assertRestaurantActive(session) {
  if (session.restaurantStatus === 'SUSPENDED')
    throw new RestaurantSuspendedError(SUSPENDED_MESSAGE);
}

/** Dados do administrador autenticado, do restaurante vinculado e dos módulos liberados. */
export async function getCurrentAdmin(auth) {
  const profile = await authRepository.findAdminProfile(auth.adminUserId);
  if (!profile) throw new UnauthorizedError();
  const { restaurant, ...admin } = profile;
  return { admin, restaurant, features: await getRestaurantFeatures(restaurant.id) };
}
