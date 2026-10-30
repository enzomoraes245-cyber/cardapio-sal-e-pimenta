import QRCode from 'qrcode';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { buildPublicFileUrl } from '../../config/storage.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { classifyAddress } from '../../shared/utils/address.js';
import { toFeatureFlags } from '../restaurants/restaurant-features.js';

/** Opções fixas: o mesmo endereço sempre gera a mesma imagem (RF-036, CA-030). */
export const QR_CODE_OPTIONS = Object.freeze({
  type: 'png',
  width: 1024,
  margin: 2,
  errorCorrectionLevel: 'M',
});

/** Mesmo QR em vetor (impressão em qualquer tamanho), sempre preto sobre branco. */
export const QR_CODE_SVG_OPTIONS = Object.freeze({
  type: 'svg',
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#ffffff' },
});

/**
 * URL pública do cardápio e dados para o material impresso. Depende só do slug, que não muda
 * com o conteúdo do cardápio. O logotipo segue o módulo de personalização, como no cardápio.
 */
export async function getPublicMenuInfo(restaurantId) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      slug: true,
      name: true,
      customization: { select: { logoKey: true } },
      features: { select: { feature: true, enabled: true } },
    },
  });
  if (!restaurant) throw new NotFoundError('Restaurante não encontrado.');
  const url = `${env.APP_PUBLIC_URL}/cardapio/${restaurant.slug}`;
  const showLogo = toFeatureFlags(restaurant.features).customization;
  return {
    slug: restaurant.slug,
    url,
    restaurantName: restaurant.name,
    logoUrl: showLogo ? buildPublicFileUrl(restaurant.customization?.logoKey) : null,
    addressKind: classifyAddress(url),
  };
}

/** RF-033: PNG do QR Code apontando para a URL pública do restaurante. */
export async function generateQrCodePng(restaurantId) {
  const { slug, url } = await getPublicMenuInfo(restaurantId);
  // A biblioteca altera o objeto de opções recebido: envia uma cópia.
  return { slug, png: await QRCode.toBuffer(url, { ...QR_CODE_OPTIONS }) };
}

/** O mesmo QR Code em SVG, para impressão e gráficas. */
export async function generateQrCodeSvg(restaurantId) {
  const { slug, url } = await getPublicMenuInfo(restaurantId);
  return {
    slug,
    svg: await QRCode.toString(url, {
      ...QR_CODE_SVG_OPTIONS,
      color: { ...QR_CODE_SVG_OPTIONS.color },
    }),
  };
}
