import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { AppError } from '../errors/app-error.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const MAX_FAILED_ATTEMPTS_PER_ACCOUNT = 10;
const MAX_FAILED_ATTEMPTS_PER_IP = 50;
const MAX_RESET_REQUESTS_PER_ACCOUNT = 5;
const MAX_RESET_REQUESTS_PER_IP = 20;

const ipKey = (req) => ipKeyGenerator(req.ip ?? '');
const ipAndEmailKey = (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ipKey(req)}:${email}`;
};

function limiter({ windowMs, limit, keyGenerator, skipSuccessfulRequests = false, message }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next) => {
      next(new AppError(message, { statusCode: 429, code: 'TOO_MANY_ATTEMPTS' }));
    },
  });
}

const LOGIN_MESSAGE = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
const RESET_MESSAGE =
  'Muitos pedidos de redefinição de senha. Aguarde e tente novamente mais tarde.';

/**
 * Limita tentativas de login malsucedidas por IP + e-mail (10 a cada 15 minutos).
 * Logins bem-sucedidos não contam. Usado na retaguarda e no backoffice.
 */
export function createLoginRateLimiter() {
  return limiter({
    windowMs: FIFTEEN_MINUTES,
    limit: MAX_FAILED_ATTEMPTS_PER_ACCOUNT,
    keyGenerator: ipAndEmailKey,
    skipSuccessfulRequests: true,
    message: LOGIN_MESSAGE,
  });
}

/**
 * Teto de falhas por IP (50 a cada 15 minutos), independente do e-mail: impede contornar o
 * limite acima trocando de e-mail a cada tentativa.
 */
export function createLoginIpRateLimiter() {
  return limiter({
    windowMs: FIFTEEN_MINUTES,
    limit: MAX_FAILED_ATTEMPTS_PER_IP,
    keyGenerator: ipKey,
    skipSuccessfulRequests: true,
    message: LOGIN_MESSAGE,
  });
}

/** Pedidos de redefinição de senha por IP + e-mail (5 por hora). */
export function createPasswordResetRequestLimiter() {
  return limiter({
    windowMs: ONE_HOUR,
    limit: MAX_RESET_REQUESTS_PER_ACCOUNT,
    keyGenerator: ipAndEmailKey,
    message: RESET_MESSAGE,
  });
}

/** Pedidos e confirmações de redefinição por IP (20 por hora). */
export function createPasswordResetIpLimiter() {
  return limiter({
    windowMs: ONE_HOUR,
    limit: MAX_RESET_REQUESTS_PER_IP,
    keyGenerator: ipKey,
    message: RESET_MESSAGE,
  });
}
