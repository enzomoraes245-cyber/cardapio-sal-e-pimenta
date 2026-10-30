import * as qrcodeService from './qrcode.service.js';

/** ?download=1 (ou true) pede o arquivo como anexo; qualquer outro valor só exibe. */
function wantsDownload(req) {
  return ['1', 'true'].includes(String(req.query.download ?? '').toLowerCase());
}

export async function getInfo(req, res) {
  res.json({ data: await qrcodeService.getPublicMenuInfo(req.tenant.restaurantId) });
}

/** RF-034 / RF-035: exibe a imagem; com ?download=1 força o download (CA-029). */
export async function getImage(req, res) {
  const { slug, png } = await qrcodeService.generateQrCodePng(req.tenant.restaurantId);
  res.type('png').set('Cache-Control', 'private, no-cache');
  if (wantsDownload(req)) res.attachment(`qrcode-cardapio-${slug}.png`);
  res.send(png);
}

/** Versão vetorial (SVG) para impressão em qualquer tamanho. */
export async function getSvg(req, res) {
  const { slug, svg } = await qrcodeService.generateQrCodeSvg(req.tenant.restaurantId);
  res.type('image/svg+xml').set('Cache-Control', 'private, no-cache');
  if (wantsDownload(req)) res.attachment(`qrcode-cardapio-${slug}.svg`);
  res.send(svg);
}
