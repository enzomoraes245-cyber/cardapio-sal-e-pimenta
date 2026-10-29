/** Data de hoje (UTC, meia-noite), usada para comparar com colunas DATE. */
export function todayUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Formata uma coluna DATE como "AAAA-MM-DD". */
export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** Formata o mês de referência como "AAAA-MM". */
export function toIsoMonth(date) {
  return date.toISOString().slice(0, 7);
}

/** "AAAA-MM" → primeiro dia do mês (UTC). */
export function parseIsoMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}
