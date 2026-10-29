/**
 * Seed de desenvolvimento: cria (ou recria) o restaurante de demonstração "demo".
 * Afeta somente os dados desse restaurante; os demais não são alterados.
 */
import { prisma } from '../src/config/database.js';
import {
  buildRestaurantFileKey,
  deleteRestaurantFolder,
  saveFile,
} from '../src/shared/utils/file-storage.js';
import { hashPassword } from '../src/shared/utils/password.js';
import { createSolidPng } from './seed-images.js';

const DEMO_RESTAURANT = { slug: 'demo', name: 'Restaurante Demonstração' };
const DEMO_CUSTOMIZATION = { primaryColor: '#9a3412', secondaryColor: '#fef3c7' };
const MIN_PASSWORD_LENGTH = 8;

const PRODUCT_IMAGE_SIZE = 480;

// cor: tom da foto ilustrativa gerada pelo seed.
const DEMO_MENU = [
  {
    name: 'Entradas',
    products: [
      {
        name: 'Bruschetta de tomate',
        shortDescription: 'Pão italiano, tomate, manjericão e azeite.',
        detailedDescription:
          'Fatias de pão italiano tostadas, cobertas com tomate fresco, manjericão, alho e azeite extravirgem. Porção com 4 unidades.',
        price: '24.90',
        color: [190, 60, 45],
      },
      {
        name: 'Pastéis de queijo',
        shortDescription: 'Porção com 6 unidades.',
        price: '29.90',
        color: [222, 170, 70],
      },
    ],
  },
  {
    name: 'Pratos principais',
    products: [
      {
        name: 'Filé à parmegiana',
        shortDescription: 'Acompanha arroz e batata frita.',
        detailedDescription:
          'Filé mignon empanado, coberto com molho de tomate e muçarela gratinada. Serve 1 pessoa.',
        price: '68.00',
        color: [160, 82, 45],
      },
      {
        name: 'Risoto de cogumelos',
        shortDescription: 'Arbóreo, mix de cogumelos e parmesão.',
        price: '58.00',
        color: [150, 130, 100],
        // Indisponível: não deve aparecer no cardápio público.
        isAvailable: false,
      },
    ],
  },
  {
    name: 'Bebidas',
    products: [
      {
        name: 'Suco natural de laranja',
        shortDescription: '400 ml.',
        price: '12.00',
        color: [245, 150, 30],
      },
      {
        name: 'Água mineral',
        shortDescription: 'Com ou sem gás, 500 ml.',
        price: '6.50',
        color: [120, 180, 220],
      },
    ],
  },
];

async function seedDemoRestaurant() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: DEMO_RESTAURANT.slug },
    update: { name: DEMO_RESTAURANT.name },
    create: DEMO_RESTAURANT,
  });

  // Fotos ilustrativas gravadas no armazenamento antes de recriar os produtos.
  await deleteRestaurantFolder(restaurant.id, 'products');
  const imageKeys = new Map();
  for (const product of DEMO_MENU.flatMap((category) => category.products)) {
    const key = buildRestaurantFileKey(restaurant.id, 'products', 'png');
    await saveFile(key, createSolidPng(PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE, product.color));
    imageKeys.set(product.name, key);
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurantCustomization.upsert({
      where: { restaurantId: restaurant.id },
      update: DEMO_CUSTOMIZATION,
      create: { restaurantId: restaurant.id, ...DEMO_CUSTOMIZATION },
    });

    await tx.product.deleteMany({ where: { restaurantId: restaurant.id } });
    await tx.category.deleteMany({ where: { restaurantId: restaurant.id } });

    for (const [categoryPosition, categoryData] of DEMO_MENU.entries()) {
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

async function seedAdminUser(restaurantId) {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';

  if (!email || !password) {
    console.log('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não definidos: usuário admin não criado.');
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`SEED_ADMIN_PASSWORD deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email },
    select: { restaurantId: true },
  });
  if (existing && existing.restaurantId !== restaurantId) {
    throw new Error(`O e-mail ${email} já pertence a outro restaurante.`);
  }

  const passwordHash = await hashPassword(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { restaurantId, email, name: 'Administrador Demo', passwordHash },
  });
  console.log(`Usuário admin ${email} criado/atualizado.`);
}

/** Assinatura de demonstração (DEC-006): R$ 99,90 com vencimento no dia 10. */
async function seedSubscription(restaurantId) {
  const today = new Date();
  await prisma.subscription.upsert({
    where: { restaurantId },
    update: {},
    create: {
      restaurantId,
      monthlyAmount: '99.90',
      dueDay: 10,
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
  const restaurant = await seedDemoRestaurant();
  await seedAdminUser(restaurant.id);
  await seedSubscription(restaurant.id);
  await seedPlatformAdmin();
  console.log(`Seed concluído. Cardápio público: /cardapio/${restaurant.slug}`);
} catch (error) {
  console.error('Falha no seed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
