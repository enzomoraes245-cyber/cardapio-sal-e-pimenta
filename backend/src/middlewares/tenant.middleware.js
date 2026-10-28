import { UnauthorizedError } from '../shared/errors/app-error.js';

/**
 * Define o contexto do restaurante (tenant) para as rotas administrativas.
 *
 * O restaurante vem EXCLUSIVAMENTE da sessão autenticada (req.auth). Qualquer
 * restaurantId enviado pelo cliente em body, query ou params é ignorado:
 * services e repositories administrativos devem filtrar sempre por req.tenant.restaurantId.
 */
export function requireTenant(req, res, next) {
  const restaurantId = req.auth?.restaurantId;
  if (!restaurantId) throw new UnauthorizedError();

  req.tenant = Object.freeze({ restaurantId });
  next();
}
