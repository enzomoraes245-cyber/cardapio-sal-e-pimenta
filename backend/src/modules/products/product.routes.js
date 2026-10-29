import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamsSchema, orderBodySchema } from '../../shared/utils/common-schemas.js';
import { imageUpload } from '../../shared/utils/image-upload.js';
import * as productController from './product.controller.js';
import {
  categoryProductsParamsSchema,
  createProductBodySchema,
  updateProductBodySchema,
} from './product.validator.js';

/** Produtos do restaurante autenticado. Montadas em /api/v1/admin/products. */
export const productRoutes = Router();

productRoutes.get('/', productController.list);
productRoutes.post(
  '/',
  imageUpload('image'),
  validate({ body: createProductBodySchema }),
  productController.create,
);
productRoutes.get('/:id', validate({ params: idParamsSchema }), productController.get);
productRoutes.patch(
  '/:id',
  validate({ params: idParamsSchema, body: updateProductBodySchema }),
  productController.update,
);
productRoutes.put(
  '/:id/image',
  imageUpload('image'),
  validate({ params: idParamsSchema }),
  productController.replaceImage,
);

/** Ordenação dentro da categoria (MOD-05). Montada em /api/v1/admin/categories. */
export const categoryProductRoutes = Router();

categoryProductRoutes.put(
  '/:categoryId/products/order',
  validate({ params: categoryProductsParamsSchema, body: orderBodySchema }),
  productController.reorder,
);
