const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export const LIGHT_TEXT = '#ffffff';
export const DARK_TEXT = '#1c1917';
// Contraste mínimo WCAG AA para texto normal.
const MIN_TEXT_CONTRAST = 4.5;

export function isHexColor(value) {
  return HEX_COLOR_PATTERN.test(value ?? '');
}

/** Luminância relativa (WCAG 2.x) de uma cor #RRGGBB. */
function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** Cor de texto (clara ou escura) com maior contraste sobre o fundo informado (CA-033). */
export function readableTextColor(backgroundHex) {
  return contrastRatio(backgroundHex, LIGHT_TEXT) >= contrastRatio(backgroundHex, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}

/**
 * Converte as cores do restaurante em variáveis CSS que sobrescrevem o tema padrão,
 * incluindo a cor de texto legível sobre cada uma. Valores fora de #RRGGBB são ignorados.
 */
export function getBrandStyle({ primaryColor, secondaryColor } = {}) {
  const style = {};
  if (isHexColor(primaryColor)) {
    style['--color-brand'] = primaryColor;
    style['--color-brand-contrast'] = readableTextColor(primaryColor);
    // Cor de marca usada como texto sobre fundo branco (ex.: preço): só se tiver contraste AA.
    style['--color-brand-text'] =
      contrastRatio(primaryColor, LIGHT_TEXT) >= MIN_TEXT_CONTRAST ? primaryColor : DARK_TEXT;
  }
  if (isHexColor(secondaryColor)) {
    style['--color-brand-soft'] = secondaryColor;
    style['--color-brand-soft-contrast'] = readableTextColor(secondaryColor);
  }
  return style;
}
