import { api, buildApiUrl } from '../../../services/api.js';

/**
 * { slug, url, restaurantName, logoUrl, addressKind } — URL pública codificada no QR Code e os
 * dados da folha impressa. `addressKind` é "public", "local" ou "private-network".
 */
export function getQrCodeInfo({ signal } = {}) {
  return api.get('/admin/qrcode', { signal });
}

/** Imagem do QR Code em PNG (1024 px) ou SVG; com `download`, o navegador salva o arquivo. */
export function getQrCodeImageUrl({ format = 'png', download = false } = {}) {
  return buildApiUrl(`/admin/qrcode/image.${format}${download ? '?download=1' : ''}`);
}
