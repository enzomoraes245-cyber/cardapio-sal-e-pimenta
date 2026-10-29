const MONEY_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;

/**
 * Converte o valor digitado ("12,50", "12.5", "R$ 12,50") em string decimal ("12.50").
 * Retorna null quando o valor é inválido (ou zero, salvo com `allowZero`).
 */
export function parseMoneyInput(value, { allowZero = false } = {}) {
  const cleaned = String(value ?? '')
    .replace(/R\$/i, '')
    .replace(/\s/g, '');
  if (!MONEY_PATTERN.test(cleaned)) return null;
  const amount = Number(cleaned.replace(',', '.'));
  if (amount === 0 && !allowZero) return null;
  return amount.toFixed(2);
}

/** Exibe um valor da API ("12.50") no formato de digitação brasileiro ("12,50"). */
export function formatMoneyInput(value) {
  return value ? String(value).replace('.', ',') : '';
}
