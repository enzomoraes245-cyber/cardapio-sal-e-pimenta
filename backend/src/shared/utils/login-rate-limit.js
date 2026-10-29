import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { AppError } from '../errors/app-error.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

/**
 * Limita tentativas de login malsucedidas por IP + e-mail (10 a cada 15 minutos).
 * Logins bem-sucedidos não contam. Usado na retaguarda e no backoffice.
 */
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_FAILED_ATTEMPTS,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      return `${ipKeyGenerator(req.ip ?? '')}:${email}`;
    },
    handler: (req, res, next) => {
      next(
        new AppError('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.', {
          statusCode: 429,
          code: 'TOO_MANY_ATTEMPTS',
        }),
      );
    },
  });
}
