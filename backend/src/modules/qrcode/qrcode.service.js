import QRCode from 'qrcode';
import { env } from '../../config/env.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import * as restaurantRepository from '../restaurants/restaurant.repository.js';

/** Opções fixas: o mesmo endereço sempre gera a mesma imagem (RF-036, CA-030). */
export const QR_CODE_OPTIONS = Object.freeze({
  type: 'png',
  width: 1024,
  margin: 2,
  errorCorrectionLevel: 'M',
});

/** URL pública do cardápio. Depende só do slug, que não muda com o conteúdo do cardápio. */
export async function getPublicMenuInfo(restaurantId) {
  const restaurant = await restaurantRepository.findSlugById(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurante não encontrado.');
  return { slug: restaurant.slug, url: `${env.APP_PUBLIC_URL}/cardapio/${restaurant.slug}` };
}

/** RF-033: PNG do QR Code apontando para a URL pública do restaurante. */
export async function generateQrCodePng(restaurantId) {
  const { slug, url } = await getPublicMenuInfo(restaurantId);
  return { slug, png: await QRCode.toBuffer(url, QR_CODE_OPTIONS) };
}
