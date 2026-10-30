import { Router } from 'express';
import { requirePlatformAdmin } from '../../../middlewares/platform-auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  createLoginIpRateLimiter,
  createLoginRateLimiter,
} from '../../../shared/utils/login-rate-limit.js';
import { loginBodySchema } from '../../auth/auth.validator.js';
import { mountPasswordResetRoutes } from '../../password-reset/password-reset.routes.js';
import { changePasswordSchema } from '../../password-reset/password-reset.validator.js';
import * as platformAuthController from './platform-auth.controller.js';

/** Autenticação do backoffice. Montada em /api/v1/platform/auth. */
export const platformAuthRoutes = Router();

platformAuthRoutes.post(
  '/login',
  createLoginIpRateLimiter(),
  createLoginRateLimiter(),
  validate({ body: loginBodySchema }),
  platformAuthController.login,
);
platformAuthRoutes.post('/logout', platformAuthController.logout);
platformAuthRoutes.get('/me', requirePlatformAdmin, platformAuthController.me);
platformAuthRoutes.put(
  '/password',
  requirePlatformAdmin,
  validate({ body: changePasswordSchema }),
  platformAuthController.changePassword,
);
mountPasswordResetRoutes(platformAuthRoutes, 'platform');
