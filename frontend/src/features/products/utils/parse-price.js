const PRICE_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;

/**
 * Converte o preço digitado ("12,50", "12.5", "R$ 12,50") em string decimal ("12.50").
 * Retorna null quando o valor não é um preço válido maior que zero.
 */
export function parsePriceInput(value) {
  const cleaned = String(value ?? '')
    .replace(/R\$/i, '')
    .replace(/\s/g, '');
  if (!PRICE_PATTERN.test(cleaned)) return null;
  const normalized = cleaned.replace(',', '.');
  return Number(normalized) > 0 ? Number(normalized).toFixed(2) : null;
}

/** Exibe o preço da API ("12.50") no formato de digitação brasileiro ("12,50"). */
export function formatPriceInput(price) {
  return price ? String(price).replace('.', ',') : '';
}
