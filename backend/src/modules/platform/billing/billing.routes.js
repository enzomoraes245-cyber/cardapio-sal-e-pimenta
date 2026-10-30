import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { idParamsSchema } from '../../../shared/utils/common-schemas.js';
import { subscriptionSchema } from '../restaurants/platform-restaurant.validator.js';
import * as billingController from './billing.controller.js';
import {
  cancelInvoiceSchema,
  generateInvoicesSchema,
  listInvoicesQuerySchema,
  listPaymentsQuerySchema,
  overviewQuerySchema,
  recordPaymentSchema,
  reopenInvoiceSchema,
  voidPaymentSchema,
} from './billing.validator.js';

/**
 * Assinaturas, mensalidades, pagamentos e visão geral. Montadas em /api/v1/platform.
 * Cada mudança de situação tem a própria rota (com motivo quando aplicável); não há troca livre
 * de status.
 */
export const billingRoutes = Router();

billingRoutes.get(
  '/overview',
  validate({ query: overviewQuerySchema }),
  billingController.getOverview,
);
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
billingRoutes.post(
  '/invoices/:id/payments',
  validate({ params: idParamsSchema, body: recordPaymentSchema }),
  billingController.recordPayment,
);
billingRoutes.post(
  '/invoices/:id/cancel',
  validate({ params: idParamsSchema, body: cancelInvoiceSchema }),
  billingController.cancelInvoice,
);
billingRoutes.post(
  '/invoices/:id/reopen',
  validate({ params: idParamsSchema, body: reopenInvoiceSchema }),
  billingController.reopenInvoice,
);
billingRoutes.get(
  '/payments',
  validate({ query: listPaymentsQuerySchema }),
  billingController.listPayments,
);
billingRoutes.post(
  '/payments/:id/void',
  validate({ params: idParamsSchema, body: voidPaymentSchema }),
  billingController.voidPayment,
);
