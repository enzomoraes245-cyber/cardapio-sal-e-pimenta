import { api } from '../../../../services/api.js';

/** Serviço de sessão dos operadores do backoffice, usado pelo SessionProvider. */
export const platformSessionService = Object.freeze({
  getCurrent: ({ signal } = {}) => api.get('/platform/auth/me', { signal }),
  login: ({ email, password }) => api.post('/platform/auth/login', { email, password }),
  logout: () => api.post('/platform/auth/logout'),
});
