import { validate } from '../../middlewares/validate.middleware.js';
import {
  createPasswordResetIpLimiter,
  createPasswordResetRequestLimiter,
} from '../../shared/utils/login-rate-limit.js';
import { createPasswordResetController } from './password-reset.controller.js';
import { forgotPasswordSchema, resetPasswordSchema } from './password-reset.validator.js';

/**
 * Rotas públicas de recuperação de senha de uma área ("restaurant" ou "platform"), montadas no
 * roteador de autenticação correspondente:
 *   GET  /password/recovery  → { emailRecovery, developmentMailLog }
 *   POST /password/forgot    → 202 (mesma resposta exista ou não o e-mail)
 *   POST /password/reset     → 204
 */
export function mountPasswordResetRoutes(router, audience) {
  const controller = createPasswordResetController(audience);

  router.get('/password/recovery', controller.recovery);
  router.post(
    '/password/forgot',
    createPasswordResetIpLimiter(),
    createPasswordResetRequestLimiter(),
    validate({ body: forgotPasswordSchema }),
    controller.forgot,
  );
  router.post(
    '/password/reset',
    createPasswordResetIpLimiter(),
    validate({ body: resetPasswordSchema }),
    controller.reset,
  );
}
