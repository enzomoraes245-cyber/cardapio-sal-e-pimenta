import { api } from '../../../services/api.js';

export function getCustomization({ signal } = {}) {
  return api.get('/admin/customization', { signal });
}

/** { primaryColor?, secondaryColor? } — cores em #RRGGBB ou null (cor padrão). */
export function updateCustomization(colors) {
  return api.patch('/admin/customization', colors);
}

export function replaceLogo(file) {
  const form = new FormData();
  form.append('logo', file);
  return api.put('/admin/customization/logo', form);
}

export function removeLogo() {
  return api.delete('/admin/customization/logo');
}
