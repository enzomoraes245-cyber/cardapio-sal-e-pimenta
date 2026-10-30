import { Router } from 'express';
import { requireFeature } from '../../middlewares/feature.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { imageUpload } from '../../shared/utils/image-upload.js';
import * as customizationController from './customization.controller.js';
import { customizationBodySchema } from './customization.validator.js';

/** Identidade visual (MOD-10). Montada em /api/v1/admin/customization. */
export const customizationRoutes = Router();

customizationRoutes.use(requireFeature('customization'));

customizationRoutes.get('/', customizationController.get);
customizationRoutes.patch(
  '/',
  validate({ body: customizationBodySchema }),
  customizationController.update,
);
customizationRoutes.put('/logo', imageUpload('logo'), customizationController.replaceLogo);
customizationRoutes.delete('/logo', customizationController.removeLogo);
