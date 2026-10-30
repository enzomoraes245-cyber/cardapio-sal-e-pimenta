import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import {
  ForbiddenError,
  RestaurantSuspendedError,
  UnauthorizedError,
  ValidationError,
} from '../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import {
  MAX_TOKEN_LENGTH,
  generateSessionToken,
  hashSessionToken,
  isPlausibleToken,
} from '../../shared/utils/session-token.js';
import { AUDIT_ACTIONS, restaurantAdminActor } from '../audit/audit.actions.js';
import { getRestaurantFeatures } from '../restaurants/restaurant-features.js';
import * as authRepository from './auth.repository.js';

const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';
const SUSPENDED_MESSAGE =
  'O acesso deste restaurante está suspenso. Entre em contato com o suporte da plataforma.';
const BLOCKED_MESSAGE =
  'O seu acesso foi bloqueado pela plataforma. Entre em contato com o suporte.';

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

/** Senha atual errada na troca de senha: 400 no campo (não encerra a sessão como um 401). */
export function invalidCurrentPasswordError() {
  return new ValidationError(
    [{ source: 'body', path: 'currentPassword', message: 'A senha atual está incorreta.' }],
    'A senha atual está incorreta.',
  );
}

export function blockedUserError() {
  return new ForbiddenError(BLOCKED_MESSAGE, 'USER_DISABLED');
}

/**
 * Valida as credenciais e abre uma sessão (RF-001, RF-002).
 * Restaurante suspenso e usuário bloqueado são informados somente depois de validar a senha.
 */
export async function login(email, password) {
  const admin = await authRepository.findAdminByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? (await getDummyHash()),
  );

  if (!admin || !passwordMatches) throw invalidCredentialsError();
  if (admin.disabledAt) throw blockedUserError();
  if (admin.restaurant.status === 'SUSPENDED')
    throw new RestaurantSuspendedError(SUSPENDED_MESSAGE);

  const now = new Date();
  await authRepository.deleteExpiredSessions(now);
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
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
 * Retorna null para tokens malformados, inexistentes, expirados ou de usuário bloqueado
 * (nesses dois últimos casos a sessão é removida).
 */
export async function resolveSession(token) {
  if (!isPlausibleToken(token)) return null;

  const session = await authRepository.findSessionByTokenHash(hashSessionToken(token));
  if (!session) return null;
  if (session.expiresAt <= new Date() || session.adminUser.disabledAt) {
    await authRepository.deleteSessionById(session.id);
    return null;
  }

  return {
    sessionId: session.id,
    adminUserId: session.adminUser.id,
    adminName: session.adminUser.name,
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

/** Troca da própria senha: exige a senha atual e encerra as demais sessões do usuário. */
export async function changePassword(auth, { currentPassword, newPassword }) {
  const credentials = await authRepository.findAdminPasswordHash(auth.adminUserId);
  if (!credentials) throw new UnauthorizedError();
  if (!(await verifyPassword(currentPassword, credentials.passwordHash))) {
    throw invalidCurrentPasswordError();
  }
  await authRepository.changeOwnPassword({
    adminUserId: auth.adminUserId,
    passwordHash: await hashPassword(newPassword),
    keepSessionId: auth.sessionId,
    audit: {
      actor: restaurantAdminActor(auth),
      restaurantId: auth.restaurantId,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entityType: 'ADMIN_USER',
      entityId: auth.adminUserId,
    },
  });
}
