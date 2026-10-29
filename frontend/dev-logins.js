import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { SEED_RESTAURANTS } from '../backend/prisma/seed-data.js';

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../backend');

/**
 * Contas de teste do seed para preencher a tela de login no servidor de desenvolvimento.
 * As senhas vêm do backend/.env (fora do Git) e só entram no código em `vite dev`;
 * em build e testes a lista é vazia.
 */
export function loadDevLogins() {
  const env = loadEnv('development', BACKEND_DIR, 'SEED_');
  const logins = [];

  if (env.SEED_ADMIN_PASSWORD) {
    for (const restaurant of SEED_RESTAURANTS) {
      for (const admin of restaurant.admins ?? []) {
        const email = admin.email ?? env.SEED_ADMIN_EMAIL;
        if (!email) continue;
        logins.push({
          area: 'admin',
          label: `${admin.name} (${restaurant.name})`,
          email,
          password: env.SEED_ADMIN_PASSWORD,
        });
      }
    }
  }

  if (env.SEED_PLATFORM_ADMIN_EMAIL && env.SEED_PLATFORM_ADMIN_PASSWORD) {
    logins.push({
      area: 'platform',
      label: 'Operador Demo',
      email: env.SEED_PLATFORM_ADMIN_EMAIL,
      password: env.SEED_PLATFORM_ADMIN_PASSWORD,
    });
  }

  return logins;
}
