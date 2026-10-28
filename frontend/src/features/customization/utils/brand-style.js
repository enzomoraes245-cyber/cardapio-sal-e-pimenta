const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Converte as cores do restaurante em variáveis CSS que sobrescrevem o tema padrão.
 * Valores fora do formato #RRGGBB são ignorados.
 */
export function getBrandStyle({ primaryColor, secondaryColor } = {}) {
  const style = {};
  if (HEX_COLOR_PATTERN.test(primaryColor ?? '')) style['--color-brand'] = primaryColor;
  if (HEX_COLOR_PATTERN.test(secondaryColor ?? '')) style['--color-brand-soft'] = secondaryColor;
  return style;
}
