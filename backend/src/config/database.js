import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/** Instância única do Prisma Client compartilhada por todos os repositories. */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/** Executa uma consulta trivial para confirmar que o PostgreSQL está acessível. */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
