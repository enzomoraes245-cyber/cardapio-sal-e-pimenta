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
  // Sessão dos operadores do backoffice da plataforma (cookie separado da retaguarda).
  PLATFORM_SESSION_COOKIE_NAME: z.string().min(1).default('cd_platform_session'),
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
  // Envio de e-mail (recuperação de senha). O provedor ainda não foi definido (DEC-010):
  // "log" escreve a mensagem no console (só desenvolvimento e testes); "disabled" desliga o envio.
  // Padrão: "log" fora de produção e "disabled" em produção.
  MAIL_DRIVER: z.preprocess((value) => value || undefined, z.enum(['disabled', 'log']).optional()),
  MAIL_FROM: z.string().trim().min(3).default('Cardápio Digital <nao-responda@cardapio.local>'),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(10).max(1440).default(60),
  // Fuso das datas de negócio (vencimento, início de assinatura, data de pagamento).
  APP_TIMEZONE: z
    .string()
    .default('America/Sao_Paulo')
    .refine(isValidTimeZone, 'Use um fuso IANA válido, ex.: America/Sao_Paulo.'),
});

function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}

const parsed = envSchema
  .superRefine((values, context) => {
    if (values.NODE_ENV === 'production' && values.MAIL_DRIVER === 'log') {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_DRIVER'],
        message: 'O driver "log" expõe os links no console e não pode ser usado em produção.',
      });
    }
  })
  .safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
}

const isProduction = parsed.data.NODE_ENV === 'production';

export const env = Object.freeze({
  ...parsed.data,
  MAIL_DRIVER: parsed.data.MAIL_DRIVER ?? (isProduction ? 'disabled' : 'log'),
  isProduction,
});
