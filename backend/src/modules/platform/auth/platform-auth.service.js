import { env } from '../../../config/env.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../../shared/utils/password.js';
import {
  MAX_TOKEN_LENGTH,
  generateSessionToken,
  hashSessionToken,
  isPlausibleToken,
} from '../../../shared/utils/session-token.js';
import { AUDIT_ACTIONS, platformAdminActor } from '../../audit/audit.actions.js';
import {
  getDummyHash,
  invalidCredentialsError,
  invalidCurrentPasswordError,
} from '../../auth/auth.service.js';
import * as platformAuthRepository from './platform-auth.repository.js';

/** Login do operador do backoffice (DEC-006). Mesmas proteções do login da retaguarda. */
export async function login(email, password) {
  const admin = await platformAuthRepository.findAdminByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? (await getDummyHash()),
  );
  if (!admin || !passwordMatches) throw invalidCredentialsError();

  const now = new Date();
  await platformAuthRepository.deleteExpiredSessions(now);
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  await platformAuthRepository.createSession({
    platformAdminId: admin.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

export async function logout(token) {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return;
  await platformAuthRepository.deleteSessionByTokenHash(hashSessionToken(token));
}

export async function resolveSession(token) {
  if (!isPlausibleToken(token)) return null;
  const session = await platformAuthRepository.findSessionByTokenHash(hashSessionToken(token));
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await platformAuthRepository.deleteSessionById(session.id);
    return null;
  }
  return {
    sessionId: session.id,
    platformAdminId: session.platformAdminId,
    name: session.platformAdmin.name,
  };
}

export async function getCurrentAdmin(platformAuth) {
  const admin = await platformAuthRepository.findAdminProfile(platformAuth.platformAdminId);
  if (!admin) throw new UnauthorizedError();
  return { admin };
}

/** Troca da própria senha do operador: exige a senha atual e encerra as demais sessões. */
export async function changePassword(platformAuth, { currentPassword, newPassword }) {
  const credentials = await platformAuthRepository.findAdminPasswordHash(
    platformAuth.platformAdminId,
  );
  if (!credentials) throw new UnauthorizedError();
  if (!(await verifyPassword(currentPassword, credentials.passwordHash))) {
    throw invalidCurrentPasswordError();
  }
  await platformAuthRepository.changeOwnPassword({
    platformAdminId: platformAuth.platformAdminId,
    passwordHash: await hashPassword(newPassword),
    keepSessionId: platformAuth.sessionId,
    audit: {
      actor: platformAdminActor(platformAuth),
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entityType: 'PLATFORM_ADMIN',
      entityId: platformAuth.platformAdminId,
    },
  });
}
