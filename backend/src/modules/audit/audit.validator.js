import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/utils/common-schemas.js';

export const listAuditEventsQuerySchema = paginationQuerySchema.extend({
  restaurantId: z.uuid('Identificador inválido.').optional(),
});
