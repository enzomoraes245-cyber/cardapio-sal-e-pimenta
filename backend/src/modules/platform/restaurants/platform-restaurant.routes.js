import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { idParamsSchema } from '../../../shared/utils/common-schemas.js';
import * as restaurantController from './platform-restaurant.controller.js';
import {
  adminAccessSchema,
  adminPasswordSchema,
  createAdminSchema,
  createRestaurantSchema,
  featuresSchema,
  reactivateRestaurantSchema,
  restaurantAdminParamsSchema,
  suspendRestaurantSchema,
  updateAdminSchema,
  updateRestaurantSchema,
} from './platform-restaurant.validator.js';

/** Gestão de restaurantes pelo backoffice. Montada em /api/v1/platform/restaurants. */
export const platformRestaurantRoutes = Router();

const withId = (body) => validate({ params: idParamsSchema, ...(body && { body }) });
const withAdmin = (body) =>
  validate({ params: restaurantAdminParamsSchema, ...(body && { body }) });

platformRestaurantRoutes.get('/', restaurantController.list);
platformRestaurantRoutes.post(
  '/',
  validate({ body: createRestaurantSchema }),
  restaurantController.create,
);
platformRestaurantRoutes.get('/:id', withId(), restaurantController.get);
platformRestaurantRoutes.patch('/:id', withId(updateRestaurantSchema), restaurantController.update);
platformRestaurantRoutes.post(
  '/:id/suspend',
  withId(suspendRestaurantSchema),
  restaurantController.suspend,
);
platformRestaurantRoutes.post(
  '/:id/reactivate',
  withId(reactivateRestaurantSchema),
  restaurantController.reactivate,
);
platformRestaurantRoutes.put(
  '/:id/features',
  withId(featuresSchema),
  restaurantController.updateFeatures,
);
platformRestaurantRoutes.post(
  '/:id/admins',
  withId(createAdminSchema),
  restaurantController.createAdmin,
);
platformRestaurantRoutes.patch(
  '/:id/admins/:adminId',
  withAdmin(updateAdminSchema),
  restaurantController.updateAdmin,
);
platformRestaurantRoutes.post(
  '/:id/admins/:adminId/block',
  withAdmin(adminAccessSchema),
  restaurantController.blockAdmin,
);
platformRestaurantRoutes.post(
  '/:id/admins/:adminId/unblock',
  withAdmin(adminAccessSchema),
  restaurantController.unblockAdmin,
);
platformRestaurantRoutes.put(
  '/:id/admins/:adminId/password',
  withAdmin(adminPasswordSchema),
  restaurantController.resetAdminPassword,
);
