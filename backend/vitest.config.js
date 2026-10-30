import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Os testes de integração criam e removem dados: rodam num banco exclusivo (TEST_DATABASE_URL),
// nunca no banco de desenvolvimento. Variáveis já definidas no ambiente têm precedência.
const ENV_FILE_PATH = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    'Defina TEST_DATABASE_URL em backend/.env: um banco exclusivo para os testes (veja o README).',
  );
}
if (!/test/i.test(new URL(testDatabaseUrl).pathname)) {
  throw new Error('Por segurança, o nome do banco em TEST_DATABASE_URL deve conter "test".');
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Um arquivo por vez: os testes compartilham o banco e alguns conferem números globais
    // (geração de mensalidades, visão geral da plataforma).
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: 'test', MAIL_DRIVER: 'log' },
  },
});
