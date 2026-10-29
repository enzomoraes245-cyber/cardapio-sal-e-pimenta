import { describe, expect, it } from 'vitest';
import { formatMoneyInput, parseMoneyInput } from '../src/utils/money-input.js';
import { productSchema } from '../src/features/products/validators/product.schema.js';
import { validateForm } from '../src/utils/validate-form.js';

describe('parseMoneyInput', () => {
  it('aceita zero somente com allowZero (mensalidade)', () => {
    expect(parseMoneyInput('0', { allowZero: true })).toBe('0.00');
    expect(parseMoneyInput('0')).toBeNull();
  });

  it('aceita formatos brasileiros e devolve decimal com 2 casas', () => {
    expect(parseMoneyInput('12,5')).toBe('12.50');
    expect(parseMoneyInput('R$ 1.99')).toBe('1.99');
    expect(parseMoneyInput('68')).toBe('68.00');
  });

  it('recusa preço zero, negativo, com 3 casas ou texto', () => {
    for (const value of ['0', '0,00', '-5', '10,999', 'abc', '', '1.000,00']) {
      expect(parseMoneyInput(value), value).toBeNull();
    }
  });

  it('formata o preço da API para edição', () => {
    expect(formatMoneyInput('24.90')).toBe('24,90');
  });
});

describe('productSchema (RN-004)', () => {
  const base = {
    name: 'Pudim',
    price: '14,90',
    categoryId: 'cat-1',
    shortDescription: '',
    detailedDescription: '',
    isActive: true,
    isAvailable: true,
  };

  it('exige foto no cadastro', () => {
    const { errors } = validateForm(productSchema({ requireImage: true }), {
      ...base,
      image: null,
    });
    expect(errors.image).toBe('Envie a fotografia do produto.');
  });

  it('na edição a foto é opcional e o preço é normalizado', () => {
    const { data } = validateForm(productSchema({ requireImage: false }), { ...base, image: null });
    expect(data.price).toBe('14.90');
  });

  it('aponta todos os campos obrigatórios ausentes', () => {
    const { errors } = validateForm(productSchema({ requireImage: true }), {
      ...base,
      name: ' ',
      price: '',
      categoryId: '',
      image: null,
    });
    expect(Object.keys(errors).sort()).toEqual(['categoryId', 'image', 'name', 'price']);
  });
});
