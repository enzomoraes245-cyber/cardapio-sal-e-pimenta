/** Junta classes condicionais: cx('a', ativo && 'b') → "a b". */
export function cx(...values) {
  return values.filter(Boolean).join(' ');
}
