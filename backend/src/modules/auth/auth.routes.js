import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createLoginRateLimiter } from '../../shared/utils/login-rate-limit.js';
import * as authController from './auth.controller.js';
import { loginBodySchema } from './auth.validator.js';

/** Autenticação da retaguarda. Montada em /api/v1/auth. */
export const authRoutes = Router();

authRoutes.post(
  '/login',
  createLoginRateLimiter(),
  validate({ body: loginBodySchema }),
  authController.login,
);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', requireAdmin, authController.me);
