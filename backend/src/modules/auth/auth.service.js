import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import * as authRepository from './auth.repository.js';

const MIN_TOKEN_LENGTH = 32;
const MAX_TOKEN_LENGTH = 256;
const TOKEN_BYTES = 32;
const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';

// Hash de referência para comparar quando o e-mail não existe: o tempo de resposta não revela
// quais e-mails estão cadastrados.
let dummyHashPromise = null;
function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString('hex'));
  return dummyHashPromise;
}

/** O banco guarda somente o hash do token; um vazamento da tabela não expõe sessões válidas. */
export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Valida as credenciais e abre uma sessão (RF-001, RF-002).
 * Retorna o token a ser enviado no cookie e a data de expiração.
 */
export async function login(email, password) {
  const admin = await authRepository.findAdminByEmail(email);
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? (await getDummyHash()),
  );

  if (!admin || !passwordMatches) {
    const error = new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = randomBytes(TOKEN_BYTES).toString('base64url');
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
  if (typeof token !== 'string') return null;
  if (token.length < MIN_TOKEN_LENGTH || token.length > MAX_TOKEN_LENGTH) return null;

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
  };
}

/** Dados do administrador autenticado e do restaurante vinculado. */
export async function getCurrentAdmin(auth) {
  const profile = await authRepository.findAdminProfile(auth.adminUserId);
  if (!profile) throw new UnauthorizedError();
  const { restaurant, ...admin } = profile;
  return { admin, restaurant };
}
