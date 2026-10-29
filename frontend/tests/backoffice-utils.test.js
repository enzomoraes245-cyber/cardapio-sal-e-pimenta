import { describe, expect, it } from 'vitest';
import { newRestaurantSchema } from '../src/features/platform/restaurants/validators/restaurant.schema.js';
import { formatDate, formatMonth } from '../src/utils/format-date.js';
import { slugify } from '../src/utils/slugify.js';
import { validateForm } from '../src/utils/validate-form.js';

describe('slugify', () => {
  it('sugere o endereço do cardápio a partir do nome', () => {
    expect(slugify('Sal & Pimenta')).toBe('sal-pimenta');
    expect(slugify('  Cantina São João — Centro ')).toBe('cantina-sao-joao-centro');
    expect(slugify('***')).toBe('');
  });
});

describe('datas', () => {
  it('formata datas sem deslocamento de fuso', () => {
    expect(formatDate('2026-01-10')).toBe('10/01/2026');
    expect(formatMonth('2026-01')).toMatch(/jan/);
  });
});

describe('newRestaurantSchema', () => {
  const valid = {
    name: 'Sal e Pimenta',
    slug: 'sal-e-pimenta',
    admin: { name: 'Dona', email: 'dona@exemplo.com', password: 'senha-segura' },
    subscription: { monthlyAmount: '99,90', dueDay: '10' },
    features: { customization: true, qrcode: true, realtime: true, productModal: false },
  };

  it('normaliza mensalidade e dia de vencimento', () => {
    const { data } = validateForm(newRestaurantSchema, valid);
    expect(data.subscription).toEqual({ monthlyAmount: '99.90', dueDay: 10 });
  });

  it('aponta slug, senha curta e vencimento fora de 1–28', () => {
    const { errors } = validateForm(newRestaurantSchema, {
      ...valid,
      slug: 'Sal e Pimenta',
      admin: { ...valid.admin, password: '123' },
      subscription: { monthlyAmount: '99,90', dueDay: '31' },
    });
    expect(Object.keys(errors).sort()).toEqual(['admin.password', 'slug', 'subscription.dueDay']);
  });
});
