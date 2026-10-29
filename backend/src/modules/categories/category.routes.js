import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamsSchema, orderBodySchema } from '../../shared/utils/common-schemas.js';
import * as categoryController from './category.controller.js';
import { categoryBodySchema } from './category.validator.js';

/** Categorias do restaurante autenticado. Montadas em /api/v1/admin/categories. */
export const categoryRoutes = Router();

categoryRoutes.get('/', categoryController.list);
categoryRoutes.post('/', validate({ body: categoryBodySchema }), categoryController.create);
// Declarada antes de "/:id" para "order" não ser interpretado como id.
categoryRoutes.put('/order', validate({ body: orderBodySchema }), categoryController.reorder);
categoryRoutes.patch(
  '/:id',
  validate({ params: idParamsSchema, body: categoryBodySchema }),
  categoryController.rename,
);
