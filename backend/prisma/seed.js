/**
 * Seed de desenvolvimento: cria (ou recria) o restaurante de demonstração "demo".
 * Afeta somente os dados desse restaurante; os demais não são alterados.
 */
import { prisma } from '../src/config/database.js';
import { hashPassword } from '../src/shared/utils/password.js';

const DEMO_RESTAURANT = { slug: 'demo', name: 'Restaurante Demonstração' };
const DEMO_CUSTOMIZATION = { primaryColor: '#9a3412', secondaryColor: '#fef3c7' };
const MIN_PASSWORD_LENGTH = 8;

const DEMO_MENU = [
  {
    name: 'Entradas',
    products: [
      {
        name: 'Bruschetta de tomate',
        description: 'Pão italiano, tomate, manjericão e azeite.',
        price: '24.90',
      },
      { name: 'Pastéis de queijo', description: 'Porção com 6 unidades.', price: '29.90' },
    ],
  },
  {
    name: 'Pratos principais',
    products: [
      {
        name: 'Filé à parmegiana',
        description: 'Acompanha arroz e batata frita.',
        price: '68.00',
      },
      {
        name: 'Risoto de cogumelos',
        description: 'Arbóreo, mix de cogumelos e parmesão.',
        price: '58.00',
        // Indisponível: não deve aparecer no cardápio público.
        isAvailable: false,
      },
    ],
  },
  {
    name: 'Bebidas',
    products: [
      { name: 'Suco natural de laranja', description: '400 ml.', price: '12.00' },
      { name: 'Água mineral', description: 'Com ou sem gás, 500 ml.', price: '6.50' },
    ],
  },
];

async function seedDemoRestaurant() {
  return prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.upsert({
      where: { slug: DEMO_RESTAURANT.slug },
      update: { name: DEMO_RESTAURANT.name },
      create: DEMO_RESTAURANT,
    });

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
          description: product.description,
          price: product.price,
          isAvailable: product.isAvailable ?? true,
          position: productPosition,
        })),
      });
    }

    return restaurant;
  });
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

try {
  const restaurant = await seedDemoRestaurant();
  await seedAdminUser(restaurant.id);
  console.log(`Seed concluído. Cardápio público: /cardapio/${restaurant.slug}`);
} catch (error) {
  console.error('Falha no seed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
