import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

// Parâmetros recomendados pela OWASP para scrypt (N=2^17, r=8, p=1).
const SCRYPT_PARAMS = Object.freeze({ N: 2 ** 17, r: 8, p: 1 });
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEMORY = 256 * 1024 * 1024;
const HASH_PREFIX = 'scrypt';

/** Gera o hash da senha no formato scrypt$N$r$p$salt$hash (base64). */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const { N, r, p } = SCRYPT_PARAMS;
  const derived = await scrypt(password, salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEMORY });
  return [HASH_PREFIX, N, r, p, salt.toString('base64'), derived.toString('base64')].join('$');
}

/** Compara a senha com o hash armazenado em tempo constante. */
export async function verifyPassword(password, storedHash) {
  const parts = typeof storedHash === 'string' ? storedHash.split('$') : [];
  if (parts.length !== 6 || parts[0] !== HASH_PREFIX) return false;

  const [, N, r, p, saltBase64, hashBase64] = parts;
  const expected = Buffer.from(hashBase64, 'base64');
  const derived = await scrypt(password, Buffer.from(saltBase64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEMORY,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
