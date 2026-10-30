import { DARK_TEXT, LIGHT_TEXT, contrastRatio, isHexColor } from './brand-style.js';

/** Cor fixa dos textos do cardápio público (--color-ink); o fundo vem da cor secundária. */
const MENU_TEXT = '#111111';
const MIN_TEXT_CONTRAST = 4.5;
const MIN_LARGE_TEXT_CONTRAST = 3;

const formatRatio = (ratio) => `${ratio.toFixed(1).replace('.', ',')}:1`;

/**
 * Avisos de leitura para as cores escolhidas, pelas mesmas regras que o cardápio aplica
 * (features/customization/utils/brand-style.js). Não impedem salvar: orientam a escolha.
 */
export function contrastWarnings({ primaryColor, secondaryColor }) {
  const warnings = {};
  if (isHexColor(secondaryColor)) {
    const ratio = contrastRatio(secondaryColor, MENU_TEXT);
    if (ratio < MIN_TEXT_CONTRAST) {
      warnings.secondaryColor = `Os textos do cardápio são escuros e ficam difíceis de ler sobre este fundo (contraste de ${formatRatio(ratio)}; o recomendado é a partir de 4,5:1). Prefira um tom mais claro.`;
    }
  }
  if (isHexColor(primaryColor) && isHexColor(secondaryColor)) {
    // O destaque usa a cor principal só quando ela tem contraste com branco; senão, usa texto escuro.
    const highlight =
      contrastRatio(primaryColor, LIGHT_TEXT) >= MIN_TEXT_CONTRAST ? primaryColor : DARK_TEXT;
    const ratio = contrastRatio(highlight, secondaryColor);
    if (ratio < MIN_LARGE_TEXT_CONTRAST) {
      warnings.primaryColor = `O destaque do nome fica pouco visível sobre o fundo escolhido (contraste de ${formatRatio(ratio)}).`;
    }
  }
  return warnings;
}
