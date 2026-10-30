import { api } from '../../../services/api.js';

/** { name, slug, contactPhone, contactEmail, publicUrl } */
export function getEstablishment({ signal } = {}) {
  return api.get('/admin/establishment', { signal });
}

/** Nome de exibição e contato (uso interno da plataforma). */
export function updateEstablishment({ name, contactPhone, contactEmail }) {
  return api.put('/admin/establishment', { name, contactPhone, contactEmail });
}
