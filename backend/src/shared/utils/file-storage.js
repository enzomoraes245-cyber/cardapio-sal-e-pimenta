import { randomUUID } from 'node:crypto';
import { mkdir, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storageConfig } from '../../config/storage.js';

/**
 * Armazenamento de arquivos do driver "local".
 * As chaves são sempre geradas pelo servidor e isoladas por restaurante:
 *   restaurants/{restaurantId}/{pasta}/{uuid}.{ext}
 * O uuid novo a cada envio também invalida o cache do navegador ao substituir uma imagem.
 */

export function buildRestaurantFileKey(restaurantId, folder, extension) {
  return `restaurants/${restaurantId}/${folder}/${randomUUID()}.${extension}`;
}

function resolveKeyPath(key) {
  const root = storageConfig.localDir;
  const fullPath = path.resolve(root, key);
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error('Chave de armazenamento inválida.');
  }
  return fullPath;
}

export async function saveFile(key, buffer) {
  const fullPath = resolveKeyPath(key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
}

/** Remove o arquivo. Falhas são registradas e não interrompem a operação principal. */
export async function deleteFile(key) {
  if (!key) return;
  try {
    await unlink(resolveKeyPath(key));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[file-storage] Falha ao remover arquivo:', error);
  }
}

/**
 * Remove uma pasta do restaurante, ou todos os arquivos dele quando `folder` não é informado
 * (usado pelo seed de demonstração e pela limpeza dos testes).
 */
export async function deleteRestaurantFolder(restaurantId, folder) {
  const key = folder ? `restaurants/${restaurantId}/${folder}` : `restaurants/${restaurantId}`;
  await rm(resolveKeyPath(key), {
    recursive: true,
    force: true,
  });
}
