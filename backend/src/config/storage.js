import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const BACKEND_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Caminho HTTP em que o driver "local" publica os arquivos. */
export const LOCAL_STORAGE_PUBLIC_PATH = '/uploads';

/**
 * Configuração do armazenamento de imagens.
 * O PostgreSQL guarda somente a chave do arquivo; a URL pública é montada aqui,
 * o que permite trocar o driver (ex.: S3/R2) sem migrar dados.
 */
export const storageConfig = Object.freeze({
  driver: env.STORAGE_DRIVER,
  localDir: path.resolve(BACKEND_ROOT, env.STORAGE_LOCAL_DIR),
});

/** Converte a chave armazenada no banco na URL pública do arquivo. */
export function buildPublicFileUrl(key) {
  if (!key) return null;
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${LOCAL_STORAGE_PUBLIC_PATH}/${encodedKey}`;
}
