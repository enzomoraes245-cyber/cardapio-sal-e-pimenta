import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { idParamsSchema } from '../../../shared/utils/common-schemas.js';
import { subscriptionSchema } from '../restaurants/platform-restaurant.validator.js';
import * as billingController from './billing.controller.js';
import {
  generateInvoicesSchema,
  listInvoicesQuerySchema,
  updateInvoiceSchema,
} from './billing.validator.js';

/** Assinaturas e faturas. Montadas em /api/v1/platform. */
export const billingRoutes = Router();

billingRoutes.put(
  '/restaurants/:id/subscription',
  validate({ params: idParamsSchema, body: subscriptionSchema }),
  billingController.updateSubscription,
);
billingRoutes.get(
  '/invoices',
  validate({ query: listInvoicesQuerySchema }),
  billingController.listInvoices,
);
billingRoutes.post(
  '/invoices/generate',
  validate({ body: generateInvoicesSchema }),
  billingController.generateInvoices,
);
billingRoutes.patch(
  '/invoices/:id',
  validate({ params: idParamsSchema, body: updateInvoiceSchema }),
  billingController.updateInvoice,
);
