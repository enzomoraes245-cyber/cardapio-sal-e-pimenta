import { env } from '../config/env.js';
import { ForbiddenError } from '../shared/errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ALLOWED_ORIGINS = new Set([new URL(env.APP_PUBLIC_URL).origin, ...env.CORS_ORIGINS]);

/**
 * Defesa adicional contra CSRF (além do cookie SameSite=Lax): requisições que alteram dados
 * e trazem o cabeçalho Origin só são aceitas se vierem do próprio frontend.
 * Requisições sem Origin (ex.: ferramentas de linha de comando) seguem para a autenticação normal.
 */
export function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (SAFE_METHODS.has(req.method) || !origin || ALLOWED_ORIGINS.has(origin)) return next();
  throw new ForbiddenError('Origem da requisição não permitida.', 'FORBIDDEN_ORIGIN');
}
