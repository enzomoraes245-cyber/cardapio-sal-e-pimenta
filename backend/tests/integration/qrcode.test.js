import QRCode from 'qrcode';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { env } from '../../src/config/env.js';
import { QR_CODE_OPTIONS, QR_CODE_SVG_OPTIONS } from '../../src/modules/qrcode/qrcode.service.js';
import { classifyAddress } from '../../src/shared/utils/address.js';
import { createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';
import { VALID_PNG } from './helpers/images.js';

const app = createApp();
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let tenantA;
let tenantB;

beforeAll(async () => {
  tenantA = await createTenantFixture('qr-a');
  tenantB = await createTenantFixture('qr-b');
});

afterAll(async () => {
  await deleteRestaurantFixtures([tenantA.restaurant.id, tenantB.restaurant.id]);
  await prisma.$disconnect();
});

const menuUrl = (tenant) => `${env.APP_PUBLIC_URL}/cardapio/${tenant.restaurant.slug}`;

const getFile = (tenant, file, query = '') =>
  request(app)
    .get(`/api/v1/admin/qrcode/${file}${query}`)
    .set('Cookie', tenant.cookie)
    .buffer(true)
    .parse((res, callback) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    });

const getImage = (tenant, query) => getFile(tenant, 'image.png', query);
const getInfo = async (tenant) =>
  (await request(app).get('/api/v1/admin/qrcode').set('Cookie', tenant.cookie)).body.data;

describe('QR Code (MOD-09)', () => {
  it('informa a URL pública e os dados do material impresso do restaurante da sessão (RF-033)', async () => {
    const response = await request(app).get('/api/v1/admin/qrcode').set('Cookie', tenantA.cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      slug: tenantA.restaurant.slug,
      url: menuUrl(tenantA),
      restaurantName: tenantA.restaurant.name,
      logoUrl: null,
      addressKind: classifyAddress(menuUrl(tenantA)),
    });
  });

  it('gera PNG que codifica exatamente a URL do cardápio do restaurante (CA-028)', async () => {
    const response = await getImage(tenantA);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['content-disposition']).toBeUndefined();
    expect(response.body.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);

    const expected = await QRCode.toBuffer(menuUrl(tenantA), { ...QR_CODE_OPTIONS });
    expect(response.body.equals(expected)).toBe(true);
  });

  it('gera o mesmo QR Code em SVG, preto sobre branco, para impressão', async () => {
    const response = await getFile(tenantA, 'image.svg');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^image\/svg\+xml/);
    const svg = response.body.toString('utf8');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('#000000');
    expect(svg).toContain('#ffffff');

    const expected = await QRCode.toString(menuUrl(tenantA), {
      ...QR_CODE_SVG_OPTIONS,
      color: { ...QR_CODE_SVG_OPTIONS.color },
    });
    expect(svg).toBe(expected);
  });

  it('cada restaurante recebe o próprio QR Code', async () => {
    const [imageA, imageB] = await Promise.all([getImage(tenantA), getImage(tenantB)]);
    const [svgA, svgB] = await Promise.all([
      getFile(tenantA, 'image.svg'),
      getFile(tenantB, 'image.svg'),
    ]);

    expect(imageA.body.equals(imageB.body)).toBe(false);
    expect(svgA.body.equals(svgB.body)).toBe(false);
  });

  it('oferece o download só quando pedido com download=1 ou true (CA-029)', async () => {
    const png = await getImage(tenantA, '?download=1');
    const svg = await getFile(tenantA, 'image.svg', '?download=true');

    // O Express só usa aspas quando o nome do arquivo exige.
    expect(png.headers['content-disposition'].replaceAll('"', '')).toBe(
      `attachment; filename=qrcode-cardapio-${tenantA.restaurant.slug}.png`,
    );
    expect(svg.headers['content-disposition'].replaceAll('"', '')).toBe(
      `attachment; filename=qrcode-cardapio-${tenantA.restaurant.slug}.svg`,
    );
    for (const value of ['0', 'false', '']) {
      const response = await getImage(tenantA, `?download=${value}`);
      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toBeUndefined();
    }
  });

  it('continua igual após alterar o cardápio, o nome e as cores; o nome impresso acompanha (CA-030)', async () => {
    const before = await getImage(tenantA);
    const svgBefore = await getFile(tenantA, 'image.svg');

    const renamedCategory = await request(app)
      .patch(`/api/v1/admin/categories/${tenantA.category.id}`)
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Nova categoria' });
    const renamedRestaurant = await request(app)
      .put('/api/v1/admin/establishment')
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Nome novo do restaurante', contactPhone: '', contactEmail: '' });
    const recolored = await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenantA.cookie)
      .send({ primaryColor: '#000000', secondaryColor: null });
    expect([renamedCategory.status, renamedRestaurant.status, recolored.status]).toEqual([
      200, 200, 200,
    ]);

    const after = await getImage(tenantA);
    const svgAfter = await getFile(tenantA, 'image.svg');
    expect(after.body.equals(before.body)).toBe(true);
    expect(svgAfter.body.equals(svgBefore.body)).toBe(true);

    const info = await getInfo(tenantA);
    expect(info.url).toBe(menuUrl(tenantA));
    expect(info.restaurantName).toBe('Nome novo do restaurante');
  });

  it('mostra o logotipo no material impresso só quando a personalização está liberada', async () => {
    const upload = await request(app)
      .put('/api/v1/admin/customization/logo')
      .set('Cookie', tenantB.cookie)
      .attach('logo', VALID_PNG, 'logo.png');
    expect(upload.status).toBe(200);

    expect((await getInfo(tenantB)).logoUrl).toBe(upload.body.data.logoUrl);

    await prisma.restaurantFeature.create({
      data: { restaurantId: tenantB.restaurant.id, feature: 'CUSTOMIZATION', enabled: false },
    });
    try {
      expect((await getInfo(tenantB)).logoUrl).toBeNull();
    } finally {
      await prisma.restaurantFeature.deleteMany({ where: { restaurantId: tenantB.restaurant.id } });
    }
  });

  it('bloqueia o QR Code quando o módulo não está liberado', async () => {
    await prisma.restaurantFeature.create({
      data: { restaurantId: tenantB.restaurant.id, feature: 'QRCODE', enabled: false },
    });
    try {
      for (const path of ['', '/image.png', '/image.svg']) {
        const response = await request(app)
          .get(`/api/v1/admin/qrcode${path}`)
          .set('Cookie', tenantB.cookie);
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FEATURE_DISABLED');
      }
    } finally {
      await prisma.restaurantFeature.deleteMany({ where: { restaurantId: tenantB.restaurant.id } });
    }
  });

  it('exige autenticação', async () => {
    for (const path of ['', '/image.png', '/image.svg']) {
      const response = await request(app).get(`/api/v1/admin/qrcode${path}`);
      expect(response.status).toBe(401);
    }
  });
});

describe('classifyAddress', () => {
  it.each([
    ['http://localhost:5173/cardapio/x', 'local'],
    ['http://127.0.0.1:5173/cardapio/x', 'local'],
    ['http://[::1]:5173/cardapio/x', 'local'],
    ['http://app.localhost/cardapio/x', 'local'],
    ['http://192.168.0.10:5173/cardapio/x', 'private-network'],
    ['http://10.1.2.3/cardapio/x', 'private-network'],
    ['http://172.20.0.5/cardapio/x', 'private-network'],
    ['http://[fd12:3456::1]/cardapio/x', 'private-network'],
    ['http://meu-pc:5173/cardapio/x', 'private-network'],
    ['http://meu-pc.local/cardapio/x', 'private-network'],
    ['http://172.32.0.5/cardapio/x', 'public'],
    ['https://cardapio.exemplo.com.br/cardapio/x', 'public'],
  ])('%s → %s', (url, kind) => {
    expect(classifyAddress(url)).toBe(kind);
  });
});
