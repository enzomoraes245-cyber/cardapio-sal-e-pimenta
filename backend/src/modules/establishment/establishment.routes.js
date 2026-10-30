import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as establishmentController from './establishment.controller.js';
import { establishmentBodySchema } from './establishment.validator.js';

/** Dados do estabelecimento (DEC-009). Montada em /api/v1/admin/establishment. */
export const establishmentRoutes = Router();

establishmentRoutes.get('/', establishmentController.get);
establishmentRoutes.put(
  '/',
  validate({ body: establishmentBodySchema }),
  establishmentController.update,
);
