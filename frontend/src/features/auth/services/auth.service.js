import { api } from '../../../services/api.js';

export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

/** Administrador autenticado, restaurante vinculado e módulos liberados. */
export function getCurrentAdmin({ signal } = {}) {
  return api.get('/auth/me', { signal });
}

/** Serviço de sessão da retaguarda, usado pelo SessionProvider. */
export const adminSessionService = Object.freeze({
  getCurrent: getCurrentAdmin,
  login,
  logout,
});
