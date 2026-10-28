import { describe, expect, it } from 'vitest';
import { filterMenuCategories } from '../src/features/menu/utils/filter-menu.js';

const CATEGORIES = [
  {
    id: 'entradas',
    name: 'Entradas',
    products: [
      { id: 'p1', name: 'Pastéis de queijo', description: 'Porção com 6 unidades.' },
      { id: 'p2', name: 'Bruschetta', description: 'Tomate e manjericão.' },
    ],
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    products: [{ id: 'p3', name: 'Suco de laranja', description: null }],
  },
];

describe('filterMenuCategories', () => {
  it('sem filtros, mantém todas as categorias', () => {
    expect(filterMenuCategories(CATEGORIES)).toEqual(CATEGORIES);
  });

  it('busca por nome ou descrição ignorando acentos e maiúsculas', () => {
    const result = filterMenuCategories(CATEGORIES, { search: 'PASTEIS' });
    expect(result.map((c) => c.id)).toEqual(['entradas']);
    expect(result[0].products.map((p) => p.id)).toEqual(['p1']);

    const byDescription = filterMenuCategories(CATEGORIES, { search: 'manjericao' });
    expect(byDescription[0].products.map((p) => p.id)).toEqual(['p2']);
  });

  it('combina categoria selecionada e busca, omitindo categorias vazias', () => {
    expect(filterMenuCategories(CATEGORIES, { categoryId: 'bebidas' })).toHaveLength(1);
    expect(filterMenuCategories(CATEGORIES, { categoryId: 'bebidas', search: 'queijo' })).toEqual(
      [],
    );
  });
});
