import QRCode from 'qrcode';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { env } from '../../src/config/env.js';
import { QR_CODE_OPTIONS } from '../../src/modules/qrcode/qrcode.service.js';
import { createTenantFixture } from './helpers/auth.js';
import { deleteRestaurantFixtures } from './helpers/fixtures.js';

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

const getImage = (tenant, query = '') =>
  request(app)
    .get(`/api/v1/admin/qrcode/image.png${query}`)
    .set('Cookie', tenant.cookie)
    .buffer(true)
    .parse((res, callback) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    });

describe('QR Code (MOD-09)', () => {
  it('informa a URL pública do restaurante da sessão (RF-033)', async () => {
    const response = await request(app).get('/api/v1/admin/qrcode').set('Cookie', tenantA.cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      slug: tenantA.restaurant.slug,
      url: `${env.APP_PUBLIC_URL}/cardapio/${tenantA.restaurant.slug}`,
    });
  });

  it('gera PNG que codifica exatamente a URL do cardápio do restaurante (CA-028)', async () => {
    const response = await getImage(tenantA);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.body.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);

    const expected = await QRCode.toBuffer(
      `${env.APP_PUBLIC_URL}/cardapio/${tenantA.restaurant.slug}`,
      { ...QR_CODE_OPTIONS },
    );
    expect(response.body.equals(expected)).toBe(true);
  });

  it('cada restaurante recebe o próprio QR Code', async () => {
    const [imageA, imageB] = await Promise.all([getImage(tenantA), getImage(tenantB)]);

    expect(imageA.body.equals(imageB.body)).toBe(false);
  });

  it('oferece o download da imagem (CA-029)', async () => {
    const response = await getImage(tenantA, '?download=1');

    // O Express só usa aspas quando o nome do arquivo exige.
    expect(response.headers['content-disposition'].replaceAll('"', '')).toBe(
      `attachment; filename=qrcode-cardapio-${tenantA.restaurant.slug}.png`,
    );
  });

  it('continua igual após alterar o conteúdo do cardápio (CA-030)', async () => {
    const before = await getImage(tenantA);
    await request(app)
      .patch(`/api/v1/admin/categories/${tenantA.category.id}`)
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Nova categoria' });
    await request(app)
      .patch('/api/v1/admin/customization')
      .set('Cookie', tenantA.cookie)
      .send({ name: 'Novo nome', primaryColor: '#000000' });

    const after = await getImage(tenantA);
    expect(after.body.equals(before.body)).toBe(true);
  });

  it('exige autenticação', async () => {
    const response = await request(app).get('/api/v1/admin/qrcode/image.png');

    expect(response.status).toBe(401);
  });
});
