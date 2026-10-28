import { createHash } from 'node:crypto';
import * as authRepository from './auth.repository.js';

const MIN_TOKEN_LENGTH = 32;
const MAX_TOKEN_LENGTH = 256;

/** O banco guarda somente o hash do token; um vazamento da tabela não expõe sessões válidas. */
export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Resolve o token do cookie em uma sessão ativa.
 * Retorna null para tokens malformados, inexistentes ou expirados.
 */
export async function resolveSession(token) {
  if (typeof token !== 'string') return null;
  if (token.length < MIN_TOKEN_LENGTH || token.length > MAX_TOKEN_LENGTH) return null;

  const session = await authRepository.findSessionByTokenHash(hashSessionToken(token));
  if (!session || session.expiresAt <= new Date()) return null;

  return {
    sessionId: session.id,
    adminUserId: session.adminUser.id,
    restaurantId: session.adminUser.restaurantId,
  };
}
