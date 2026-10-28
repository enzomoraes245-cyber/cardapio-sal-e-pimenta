import { env } from '../config/env.js';
import { resolveSession } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../shared/errors/app-error.js';

/**
 * Exige uma sessão administrativa válida (cookie HttpOnly).
 * Em caso de sucesso, define req.auth = { sessionId, adminUserId, restaurantId }.
 */
export async function requireAdmin(req, res, next) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!token) throw new UnauthorizedError();

  const session = await resolveSession(token);
  if (!session) throw new UnauthorizedError('Sessão inválida ou expirada.');

  req.auth = session;
  next();
}
