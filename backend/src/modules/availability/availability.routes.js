import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamsSchema } from '../../shared/utils/common-schemas.js';
import * as availabilityController from './availability.controller.js';
import { productStatusBodySchema } from './availability.validator.js';

/** Situação dos produtos (MOD-04). Montada em /api/v1/admin/products. */
export const availabilityRoutes = Router();

availabilityRoutes.patch(
  '/:id/status',
  validate({ params: idParamsSchema, body: productStatusBodySchema }),
  availabilityController.updateStatus,
);
