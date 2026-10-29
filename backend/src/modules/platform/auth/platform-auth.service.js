import { env } from '../../../config/env.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import { verifyPassword } from '../../../shared/utils/password.js';
import {
  MAX_TOKEN_LENGTH,
  generateSessionToken,
  hashSessionToken,
  isPlausibleToken,
} from '../../../shared/utils/session-token.js';
import { getDummyHash, invalidCredentialsError } from '../../auth/auth.service.js';
import * as platformAuthRepository from './platform-auth.repository.js';

/** Login do operador do backoffice (DEC-006). Mesmas proteções do login da retaguarda. */
export async function login(email, password) {
  const admin = await platformAuthRepository.findAdminByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? (await getDummyHash()),
  );
  if (!admin || !passwordMatches) throw invalidCredentialsError();

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
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
  return { sessionId: session.id, platformAdminId: session.platformAdminId };
}

export async function getCurrentAdmin(platformAuth) {
  const admin = await platformAuthRepository.findAdminProfile(platformAuth.platformAdminId);
  if (!admin) throw new UnauthorizedError();
  return { admin };
}
