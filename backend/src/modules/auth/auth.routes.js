import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createLoginIpRateLimiter,
  createLoginRateLimiter,
} from '../../shared/utils/login-rate-limit.js';
import { mountPasswordResetRoutes } from '../password-reset/password-reset.routes.js';
import { changePasswordSchema } from '../password-reset/password-reset.validator.js';
import * as authController from './auth.controller.js';
import { loginBodySchema } from './auth.validator.js';

/** Autenticação da retaguarda. Montada em /api/v1/auth. */
export const authRoutes = Router();

authRoutes.post(
  '/login',
  createLoginIpRateLimiter(),
  createLoginRateLimiter(),
  validate({ body: loginBodySchema }),
  authController.login,
);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', requireAdmin, authController.me);
authRoutes.put(
  '/password',
  requireAdmin,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);
mountPasswordResetRoutes(authRoutes, 'restaurant');
