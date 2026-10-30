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

/** Senha e recuperação de acesso da retaguarda (mesmo formato do backoffice). */
export const adminAccountService = Object.freeze({
  changePassword: ({ currentPassword, newPassword }) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  getRecoveryOptions: ({ signal } = {}) => api.get('/auth/password/recovery', { signal }),
  requestPasswordReset: (email) => api.post('/auth/password/forgot', { email }),
  resetPassword: ({ token, password }) => api.post('/auth/password/reset', { token, password }),
});
