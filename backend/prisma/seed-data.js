/**
 * Dados de demonstração do seed: restaurantes, usuários da retaguarda e cardápios.
 * color: tom da foto ilustrativa gerada para o produto.
 * admins: e-mail fixo, ou null para usar SEED_ADMIN_EMAIL (restaurante "demo").
 */
export const SEED_RESTAURANTS = [
  {
    slug: 'demo',
    name: 'Restaurante Demonstração',
    customization: { primaryColor: '#9a3412', secondaryColor: '#fef3c7' },
    subscription: { monthlyAmount: '99.90', dueDay: 10 },
    admins: [{ email: null, name: 'Administrador Demo' }],
    menu: [
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
    ],
  },
  {
    slug: 'sal-e-pimenta',
    name: 'Sal e Pimenta',
    customization: { primaryColor: '#b91c1c', secondaryColor: '#fff7ed' },
    subscription: { monthlyAmount: '129.90', dueDay: 5 },
    admins: [
      { email: 'admin@salepimenta.local', name: 'Administrador Sal e Pimenta' },
      { email: 'gerente@salepimenta.local', name: 'Gerente Sal e Pimenta' },
    ],
    menu: [
      {
        name: 'Entradas',
        products: [
          {
            name: 'Bolinho de bacalhau',
            shortDescription: 'Porção com 8 unidades e limão.',
            detailedDescription:
              'Bolinhos de bacalhau desfiado com batata e salsinha, fritos na hora. Acompanha limão e molho de pimenta da casa.',
            price: '39.90',
            color: [210, 160, 80],
          },
          {
            name: 'Caldinho de feijão',
            shortDescription: 'Com bacon crocante e cebolinha.',
            price: '14.90',
            color: [90, 55, 35],
          },
          {
            name: 'Mandioca frita',
            shortDescription: 'Porção para 2 pessoas.',
            price: '27.00',
            color: [235, 200, 120],
          },
        ],
      },
      {
        name: 'Pratos executivos',
        products: [
          {
            name: 'Executivo de frango grelhado',
            shortDescription: 'Arroz, feijão, salada e fritas.',
            price: '32.90',
            color: [200, 150, 90],
          },
          {
            name: 'Executivo de bife acebolado',
            shortDescription: 'Arroz, feijão, farofa e salada.',
            price: '36.90',
            color: [130, 70, 40],
          },
          {
            name: 'Executivo de peixe',
            shortDescription: 'Tilápia grelhada, arroz, purê e legumes.',
            price: '38.90',
            color: [225, 215, 190],
          },
        ],
      },
      {
        name: 'Especialidades da casa',
        products: [
          {
            name: 'Feijoada completa',
            shortDescription: 'Serve 2 pessoas. Sábados.',
            detailedDescription:
              'Feijão preto com carnes selecionadas, acompanhada de arroz, couve refogada, farofa, torresmo e laranja.',
            price: '89.90',
            color: [50, 35, 30],
          },
          {
            name: 'Picanha na chapa',
            shortDescription: '400 g, com arroz, vinagrete e mandioca.',
            detailedDescription:
              'Picanha fatiada na chapa com alho, servida com arroz branco, vinagrete, farofa e mandioca cozida. Serve 2 pessoas.',
            price: '119.00',
            color: [150, 50, 40],
          },
          {
            name: 'Moqueca de camarão',
            shortDescription: 'Com arroz e pirão.',
            price: '98.00',
            color: [220, 110, 40],
            isAvailable: false,
          },
        ],
      },
      {
        name: 'Sobremesas',
        products: [
          {
            name: 'Pudim de leite',
            shortDescription: 'Fatia com calda de caramelo.',
            price: '14.00',
            color: [230, 180, 90],
          },
          {
            name: 'Petit gâteau',
            shortDescription: 'Com sorvete de creme.',
            price: '24.00',
            color: [80, 45, 30],
          },
        ],
      },
      {
        name: 'Bebidas',
        products: [
          {
            name: 'Refrigerante lata',
            shortDescription: '350 ml.',
            price: '7.00',
            color: [180, 30, 30],
          },
          {
            name: 'Caipirinha de limão',
            shortDescription: 'Cachaça, limão e açúcar.',
            price: '22.00',
            color: [180, 220, 120],
          },
          {
            name: 'Suco de maracujá',
            shortDescription: '500 ml.',
            price: '13.00',
            color: [250, 200, 40],
          },
        ],
      },
    ],
  },
  {
    slug: 'bella-napoli',
    name: 'Pizzaria Bella Napoli',
    customization: { primaryColor: '#166534', secondaryColor: '#fefce8' },
    subscription: { monthlyAmount: '99.90', dueDay: 15 },
    admins: [{ email: 'admin@bellanapoli.local', name: 'Administrador Bella Napoli' }],
    menu: [
      {
        name: 'Pizzas salgadas',
        products: [
          {
            name: 'Margherita',
            shortDescription: 'Molho de tomate, muçarela e manjericão.',
            detailedDescription: 'Pizza grande, 8 fatias, massa de fermentação natural.',
            price: '59.90',
            color: [200, 50, 40],
          },
          {
            name: 'Calabresa',
            shortDescription: 'Calabresa fatiada, cebola e azeitonas.',
            price: '57.90',
            color: [170, 60, 40],
          },
          {
            name: 'Quatro queijos',
            shortDescription: 'Muçarela, provolone, parmesão e gorgonzola.',
            price: '66.90',
            color: [240, 210, 140],
          },
          {
            name: 'Portuguesa',
            shortDescription: 'Presunto, ovo, cebola, ervilha e muçarela.',
            price: '62.90',
            color: [220, 170, 90],
          },
        ],
      },
      {
        name: 'Pizzas doces',
        products: [
          {
            name: 'Chocolate com morango',
            shortDescription: 'Chocolate ao leite e morangos frescos.',
            price: '54.90',
            color: [100, 50, 40],
          },
          {
            name: 'Romeu e Julieta',
            shortDescription: 'Goiabada e muçarela.',
            price: '49.90',
            color: [190, 70, 80],
          },
        ],
      },
      {
        name: 'Bebidas',
        products: [
          {
            name: 'Refrigerante 2 L',
            shortDescription: 'Consulte os sabores.',
            price: '14.00',
            color: [60, 30, 25],
          },
          {
            name: 'Cerveja long neck',
            shortDescription: '355 ml.',
            price: '11.00',
            color: [210, 160, 40],
          },
        ],
      },
    ],
  },
  {
    slug: 'cafe-aroma',
    name: 'Café Aroma',
    customization: { primaryColor: '#78350f', secondaryColor: '#fafaf9' },
    subscription: { monthlyAmount: '79.90', dueDay: 20 },
    admins: [{ email: 'admin@cafearoma.local', name: 'Administrador Café Aroma' }],
    menu: [
      {
        name: 'Cafés',
        products: [
          {
            name: 'Espresso',
            shortDescription: 'Grãos especiais, 50 ml.',
            price: '7.50',
            color: [60, 35, 20],
          },
          {
            name: 'Cappuccino',
            shortDescription: 'Espresso, leite vaporizado e canela.',
            price: '13.90',
            color: [180, 130, 90],
          },
          {
            name: 'Latte gelado',
            shortDescription: 'Espresso, leite e gelo, 300 ml.',
            price: '15.90',
            color: [210, 180, 140],
          },
        ],
      },
      {
        name: 'Salgados',
        products: [
          {
            name: 'Pão de queijo',
            shortDescription: 'Porção com 5 unidades.',
            price: '12.00',
            color: [230, 190, 100],
          },
          {
            name: 'Croissant de presunto e queijo',
            shortDescription: 'Massa folhada amanteigada.',
            price: '16.50',
            color: [215, 160, 80],
          },
        ],
      },
      {
        name: 'Doces',
        products: [
          {
            name: 'Bolo de cenoura',
            shortDescription: 'Fatia com cobertura de chocolate.',
            price: '11.00',
            color: [235, 130, 40],
          },
          {
            name: 'Cheesecake de frutas vermelhas',
            shortDescription: 'Fatia.',
            price: '18.90',
            color: [170, 30, 60],
          },
        ],
      },
    ],
  },
];
