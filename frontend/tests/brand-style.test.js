import { describe, expect, it } from 'vitest';
import {
  DARK_TEXT,
  LIGHT_TEXT,
  contrastRatio,
  getBrandStyle,
  readableTextColor,
} from '../src/features/customization/utils/brand-style.js';

describe('legibilidade das cores (CA-033)', () => {
  it('escolhe texto claro sobre cor escura e texto escuro sobre cor clara', () => {
    expect(readableTextColor('#1e3a8a')).toBe(LIGHT_TEXT);
    expect(readableTextColor('#fde047')).toBe(DARK_TEXT);
    expect(readableTextColor('#ffffff')).toBe(DARK_TEXT);
  });

  it('calcula o contraste WCAG', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('gera as variáveis CSS do restaurante, com cor de texto legível', () => {
    expect(getBrandStyle({ primaryColor: '#1e3a8a', secondaryColor: '#fef3c7' })).toEqual({
      '--color-brand': '#1e3a8a',
      '--color-brand-contrast': LIGHT_TEXT,
      '--color-brand-text': '#1e3a8a',
      '--color-brand-soft': '#fef3c7',
      '--color-brand-soft-contrast': DARK_TEXT,
    });
  });

  it('não usa a cor principal como texto sobre branco quando ela é clara demais', () => {
    expect(getBrandStyle({ primaryColor: '#fde047' })['--color-brand-text']).toBe(DARK_TEXT);
  });

  it('ignora valores fora do formato #RRGGBB', () => {
    expect(getBrandStyle({ primaryColor: 'red', secondaryColor: null })).toEqual({});
  });
});
