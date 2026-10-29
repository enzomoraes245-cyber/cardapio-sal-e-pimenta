/**
 * Seed de desenvolvimento: cria (ou recria) os restaurantes de demonstração de seed-data.js,
 * com usuários da retaguarda, cardápio, identidade visual e assinatura.
 * Afeta somente os dados desses restaurantes; os demais não são alterados.
 *
 * Todos os usuários da retaguarda usam a senha SEED_ADMIN_PASSWORD.
 */
import { readFile } from 'node:fs/promises';
import { prisma } from '../src/config/database.js';
import {
  buildRestaurantFileKey,
  deleteRestaurantFolder,
  saveFile,
} from '../src/shared/utils/file-storage.js';
import { hashPassword } from '../src/shared/utils/password.js';
import { SEED_RESTAURANTS } from './seed-data.js';
import { createSolidPng } from './seed-images.js';

const MIN_PASSWORD_LENGTH = 8;
const PRODUCT_IMAGE_SIZE = 480;
const SEED_ASSETS_DIR = new URL('./seed-assets/', import.meta.url);

/** Foto do produto: arquivo em seed-assets/ (`image`) ou um PNG de cor sólida (`color`). */
async function loadProductImage(product) {
  if (product.image) {
    const extension = product.image.split('.').pop().toLowerCase();
    return { extension, data: await readFile(new URL(product.image, SEED_ASSETS_DIR)) };
  }
  return {
    extension: 'png',
    data: createSolidPng(PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE, product.color),
  };
}

async function seedRestaurant({ slug, name, customization, menu }) {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });

  // Fotos ilustrativas gravadas no armazenamento antes de recriar os produtos.
  await deleteRestaurantFolder(restaurant.id, 'products');
  const imageKeys = new Map();
  for (const product of menu.flatMap((category) => category.products)) {
    const { extension, data } = await loadProductImage(product);
    const key = buildRestaurantFileKey(restaurant.id, 'products', extension);
    await saveFile(key, data);
    imageKeys.set(product.name, key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurantCustomization.upsert({
      where: { restaurantId: restaurant.id },
      update: customization,
      create: { restaurantId: restaurant.id, ...customization },
    });

    await tx.product.deleteMany({ where: { restaurantId: restaurant.id } });
    await tx.category.deleteMany({ where: { restaurantId: restaurant.id } });

    for (const [categoryPosition, categoryData] of menu.entries()) {
      const category = await tx.category.create({
        data: { restaurantId: restaurant.id, name: categoryData.name, position: categoryPosition },
      });

      await tx.product.createMany({
        data: categoryData.products.map((product, productPosition) => ({
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: product.name,
          shortDescription: product.shortDescription,
          detailedDescription: product.detailedDescription ?? null,
          price: product.price,
          imageKey: imageKeys.get(product.name),
          isAvailable: product.isAvailable ?? true,
          position: productPosition,
        })),
      });
    }
  });

  return restaurant;
}

/** Hash calculado uma vez: todos os usuários do seed compartilham a mesma senha. */
async function getAdminPasswordHash() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (!password) return null;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`SEED_ADMIN_PASSWORD deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  return hashPassword(password);
}

async function seedAdminUsers(restaurantId, admins, passwordHash) {
  for (const admin of admins) {
    const email = (admin.email ?? process.env.SEED_ADMIN_EMAIL)?.trim().toLowerCase();
    if (!email) continue;

    const existing = await prisma.adminUser.findUnique({
      where: { email },
      select: { restaurantId: true },
    });
    if (existing && existing.restaurantId !== restaurantId) {
      throw new Error(`O e-mail ${email} já pertence a outro restaurante.`);
    }

    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, name: admin.name },
      create: { restaurantId, email, name: admin.name, passwordHash },
    });
    console.log(`  Usuário ${email} criado/atualizado.`);
  }
}

/** Assinatura de demonstração (DEC-006), iniciada no primeiro dia do mês corrente. */
async function seedSubscription(restaurantId, { monthlyAmount, dueDay }) {
  const today = new Date();
  await prisma.subscription.upsert({
    where: { restaurantId },
    update: {},
    create: {
      restaurantId,
      monthlyAmount,
      dueDay,
      startedAt: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
    },
  });
}

/** Operador do backoffice de demonstração, criado somente se as variáveis estiverem definidas. */
async function seedPlatformAdmin() {
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD ?? '';
  if (!email || !password) {
    console.log('SEED_PLATFORM_ADMIN_EMAIL/PASSWORD não definidos: operador não criado.');
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_PLATFORM_ADMIN_PASSWORD deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  const passwordHash = await hashPassword(password);
  await prisma.platformAdmin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: 'Operador Demo', passwordHash },
  });
  console.log(`Operador do backoffice ${email} criado/atualizado.`);
}

try {
  const passwordHash = await getAdminPasswordHash();
  if (!passwordHash) {
    console.log('SEED_ADMIN_PASSWORD não definido: usuários da retaguarda não criados.');
  }

  for (const data of SEED_RESTAURANTS) {
    const restaurant = await seedRestaurant(data);
    const productCount = data.menu.reduce((total, c) => total + c.products.length, 0);
    console.log(
      `${data.name}: ${data.menu.length} categorias, ${productCount} produtos — /cardapio/${restaurant.slug}`,
    );
    if (passwordHash) await seedAdminUsers(restaurant.id, data.admins, passwordHash);
    await seedSubscription(restaurant.id, data.subscription);
  }

  await seedPlatformAdmin();
  console.log('Seed concluído.');
} catch (error) {
  console.error('Falha no seed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
