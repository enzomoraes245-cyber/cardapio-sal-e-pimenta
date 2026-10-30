import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { classifyAddress } from '../shared/utils/address.js';

// Carrega backend/.env quando existir. Variáveis já definidas no ambiente têm precedência.
const ENV_FILE_PATH = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

/**
 * "trust proxy" do Express (IP real do cliente atrás de proxy reverso, usado nos limites de
 * tentativas): vazio ou "false" = sem proxy; "true"; número de saltos ("1"); ou lista de
 * endereços/sub-redes ("loopback, 10.0.0.0/8").
 */
function parseTrustProxy(value) {
  if (value === '' || value === 'false') return false;
  if (value === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
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
  TRUST_PROXY: z.string().trim().default('').transform(parseTrustProxy),
  SESSION_COOKIE_NAME: z.string().min(1).default('cd_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(12),
  // Sessão dos operadores do backoffice da plataforma (cookie separado da retaguarda).
  PLATFORM_SESSION_COOKIE_NAME: z.string().min(1).default('cd_platform_session'),
  // Endereço público do frontend: base da URL do cardápio no QR Code e origem aceita em escritas.
  APP_PUBLIC_URL: z
    .url({ protocol: /^https?$/, error: 'Use um endereço http:// ou https://.' })
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

/** Regras que só valem em produção. */
function productionRules(values, context) {
  if (values.NODE_ENV !== 'production') return;
  if (values.MAIL_DRIVER === 'log') {
    context.addIssue({
      code: 'custom',
      path: ['MAIL_DRIVER'],
      message: 'O driver "log" expõe os links no console e não pode ser usado em produção.',
    });
  }
  // QR Codes impressos apontam para este endereço: em produção ele precisa ser o público.
  if (classifyAddress(values.APP_PUBLIC_URL) !== 'public') {
    context.addIssue({
      code: 'custom',
      path: ['APP_PUBLIC_URL'],
      message:
        'Em produção, use o endereço público definitivo do cardápio (os QR Codes impressos apontam para ele); endereço local ou de rede interna não é aceito.',
    });
  }
}

/** Valida as variáveis de ambiente e devolve a configuração (exportada para os testes). */
export function loadEnv(source = process.env) {
  const parsed = envSchema.superRefine(productionRules).safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }

  const isProduction = parsed.data.NODE_ENV === 'production';
  return Object.freeze({
    ...parsed.data,
    MAIL_DRIVER: parsed.data.MAIL_DRIVER ?? (isProduction ? 'disabled' : 'log'),
    // Cookies de sessão só trafegam por HTTPS em produção ou quando o endereço público é HTTPS.
    COOKIE_SECURE: isProduction || parsed.data.APP_PUBLIC_URL.startsWith('https://'),
    isProduction,
  });
}

export const env = loadEnv();
