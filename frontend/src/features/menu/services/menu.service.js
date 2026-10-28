import { api, buildApiUrl } from '../../../services/api.js';

export const MENU_UPDATED_EVENT = 'menu.updated';

function restaurantPath(slug) {
  return `/public/restaurants/${encodeURIComponent(slug)}`;
}

export function getPublicMenu(slug, { signal } = {}) {
  return api.get(`${restaurantPath(slug)}/menu`, { signal });
}

export function getMenuEventsUrl(slug) {
  return buildApiUrl(`${restaurantPath(slug)}/events`);
}
