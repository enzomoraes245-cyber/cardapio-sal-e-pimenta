import { api, buildApiUrl } from '../../../services/api.js';

/** { slug, url } — URL pública do cardápio codificada no QR Code. */
export function getQrCodeInfo({ signal } = {}) {
  return api.get('/admin/qrcode', { signal });
}

export function getQrCodeImageUrl({ download = false } = {}) {
  return buildApiUrl(`/admin/qrcode/image.png${download ? '?download=1' : ''}`);
}
