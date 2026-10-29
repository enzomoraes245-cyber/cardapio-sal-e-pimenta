import * as qrcodeService from './qrcode.service.js';

export async function getInfo(req, res) {
  res.json({ data: await qrcodeService.getPublicMenuInfo(req.tenant.restaurantId) });
}

/** RF-034 / RF-035: exibe a imagem; com ?download=1 força o download (CA-029). */
export async function getImage(req, res) {
  const { slug, png } = await qrcodeService.generateQrCodePng(req.tenant.restaurantId);
  res.type('png').set('Cache-Control', 'private, no-cache');
  if (req.query.download) res.attachment(`qrcode-cardapio-${slug}.png`);
  res.send(png);
}
