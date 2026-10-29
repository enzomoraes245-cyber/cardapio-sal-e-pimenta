import { env } from '../config/env.js';
import { assertRestaurantActive, resolveSession } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../shared/errors/app-error.js';

/**
 * Exige uma sessão administrativa válida (cookie HttpOnly) de restaurante não suspenso.
 * Em caso de sucesso, define req.auth = { sessionId, adminUserId, restaurantId, restaurantStatus }.
 */
export async function requireAdmin(req, res, next) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) throw new UnauthorizedError();

  const session = await resolveSession(token);
  if (!session) throw new UnauthorizedError('Sessão inválida ou expirada.');
  assertRestaurantActive(session);

  req.auth = session;
  next();
}
