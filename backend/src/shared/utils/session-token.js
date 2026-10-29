import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
export const MIN_TOKEN_LENGTH = 32;
export const MAX_TOKEN_LENGTH = 256;

/** Token aleatório enviado no cookie de sessão (retaguarda e backoffice). */
export function generateSessionToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** O banco guarda somente o hash do token; um vazamento da tabela não expõe sessões válidas. */
export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function isPlausibleToken(token) {
  return (
    typeof token === 'string' &&
    token.length >= MIN_TOKEN_LENGTH &&
    token.length <= MAX_TOKEN_LENGTH
  );
}
