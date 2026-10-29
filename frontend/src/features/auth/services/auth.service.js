import { api } from '../../../services/api.js';

export function login({ email, password }) {
  return api.post('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

/** Administrador autenticado e restaurante vinculado. */
export function getCurrentAdmin({ signal } = {}) {
  return api.get('/auth/me', { signal });
}
