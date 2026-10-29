import { env } from '../../../config/env.js';
import * as platformAuthService from './platform-auth.service.js';

const COOKIE_BASE_OPTIONS = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
});

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const { token, expiresAt } = await platformAuthService.login(email, password);

  res.cookie(env.PLATFORM_SESSION_COOKIE_NAME, token, {
    ...COOKIE_BASE_OPTIONS,
    expires: expiresAt,
  });
  res.json({ data: { expiresAt: expiresAt.toISOString() } });
}

export async function logout(req, res) {
  await platformAuthService.logout(req.cookies?.[env.PLATFORM_SESSION_COOKIE_NAME]);
  res.clearCookie(env.PLATFORM_SESSION_COOKIE_NAME, COOKIE_BASE_OPTIONS);
  res.status(204).end();
}

export async function me(req, res) {
  res.json({ data: await platformAuthService.getCurrentAdmin(req.platformAuth) });
}
