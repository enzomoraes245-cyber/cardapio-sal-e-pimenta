import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as menuController from './menu.controller.js';
import { restaurantSlugParamsSchema } from './menu.validator.js';

/** Rotas públicas (sem autenticação) do cardápio. Montadas em /api/v1/public. */
export const menuRoutes = Router();

const validateSlug = validate({ params: restaurantSlugParamsSchema });

menuRoutes.get('/restaurants/:slug/menu', validateSlug, menuController.getMenu);
menuRoutes.get('/restaurants/:slug/events', validateSlug, menuController.streamMenuEvents);
