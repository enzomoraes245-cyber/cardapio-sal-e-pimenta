import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Carrega backend/.env quando existir. Variáveis já definidas no ambiente têm precedência.
const ENV_FILE_PATH = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  SESSION_COOKIE_NAME: z.string().min(1).default('cd_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(12),
  // Endereço público do frontend: base da URL do cardápio no QR Code e origem aceita em escritas.
  APP_PUBLIC_URL: z
    .url()
    .default('http://localhost:5173')
    .transform((value) => value.replace(/\/+$/, '')),
  STORAGE_DRIVER: z.enum(['local']).default('local'),
  STORAGE_LOCAL_DIR: z.string().min(1).default('storage/uploads'),
  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
});
