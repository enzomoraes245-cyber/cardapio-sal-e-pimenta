import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

const COOKIE_BASE_OPTIONS = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
});

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const { token, expiresAt } = await authService.login(email, password);

  res.cookie(env.SESSION_COOKIE_NAME, token, { ...COOKIE_BASE_OPTIONS, expires: expiresAt });
  res.json({ data: { expiresAt: expiresAt.toISOString() } });
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[env.SESSION_COOKIE_NAME]);
  res.clearCookie(env.SESSION_COOKIE_NAME, COOKIE_BASE_OPTIONS);
  res.status(204).end();
}

export async function me(req, res) {
  res.json({ data: await authService.getCurrentAdmin(req.auth) });
}
