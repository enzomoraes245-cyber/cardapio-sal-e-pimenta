import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import * as auditController from './audit.controller.js';
import { listAuditEventsQuerySchema } from './audit.validator.js';

/** Histórico de ações (backoffice). Montado em /api/v1/platform/audit-events. */
export const auditRoutes = Router();

auditRoutes.get('/', validate({ query: listAuditEventsQuerySchema }), auditController.list);
