import { api } from '../../../../services/api.js';

/** Serviço de sessão dos operadores do backoffice, usado pelo SessionProvider. */
export const platformSessionService = Object.freeze({
  getCurrent: ({ signal } = {}) => api.get('/platform/auth/me', { signal }),
  login: ({ email, password }) => api.post('/platform/auth/login', { email, password }),
  logout: () => api.post('/platform/auth/logout'),
});

/** Senha e recuperação de acesso dos operadores (mesmo formato da retaguarda). */
export const platformAccountService = Object.freeze({
  changePassword: ({ currentPassword, newPassword }) =>
    api.put('/platform/auth/password', { currentPassword, newPassword }),
  getRecoveryOptions: ({ signal } = {}) => api.get('/platform/auth/password/recovery', { signal }),
  requestPasswordReset: (email) => api.post('/platform/auth/password/forgot', { email }),
  resetPassword: ({ token, password }) =>
    api.post('/platform/auth/password/reset', { token, password }),
});
