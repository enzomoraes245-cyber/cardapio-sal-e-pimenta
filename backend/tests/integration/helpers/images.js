import { existsSync } from 'node:fs';
import path from 'node:path';
import { createSolidPng } from '../../../prisma/seed-images.js';
import { storageConfig } from '../../../src/config/storage.js';

export const VALID_PNG = createSolidPng(4, 4, [200, 50, 50]);
export const OTHER_PNG = createSolidPng(4, 4, [50, 50, 200]);
// Extensão .png, mas o conteúdo não é uma imagem.
export const FAKE_PNG = Buffer.from('isto não é uma imagem');

/** Confere se o arquivo da URL pública (/uploads/...) existe no armazenamento local. */
export function storedFileExists(imageUrl) {
  const key = decodeURIComponent(imageUrl.replace(/^\/uploads\//, ''));
  return existsSync(path.join(storageConfig.localDir, key));
}
