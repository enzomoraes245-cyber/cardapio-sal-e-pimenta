import { api } from '../../../services/api.js';

export function getCustomization({ signal } = {}) {
  return api.get('/admin/customization', { signal });
}

/** { name?, primaryColor?, secondaryColor? } — cores em #RRGGBB ou null. */
export function updateCustomization(data) {
  return api.patch('/admin/customization', data);
}

export function replaceLogo(file) {
  const form = new FormData();
  form.append('logo', file);
  return api.put('/admin/customization/logo', form);
}
