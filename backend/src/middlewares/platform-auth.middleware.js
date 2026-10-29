import { env } from '../config/env.js';
import { resolveSession } from '../modules/platform/auth/platform-auth.service.js';
import { UnauthorizedError } from '../shared/errors/app-error.js';

/**
 * Exige sessão de operador do backoffice (cookie próprio). A sessão de administrador de
 * restaurante não dá acesso às rotas /platform.
 * Em caso de sucesso, define req.platformAuth = { sessionId, platformAdminId }.
 */
export async function requirePlatformAdmin(req, res, next) {
  const token = req.cookies?.[env.PLATFORM_SESSION_COOKIE_NAME];
  if (!token) throw new UnauthorizedError();

  const session = await resolveSession(token);
  if (!session) throw new UnauthorizedError('Sessão inválida ou expirada.');

  req.platformAuth = session;
  next();
}
