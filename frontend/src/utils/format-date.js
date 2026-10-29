const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** "2026-01-10" → "10/01/2026" (datas sem horário, interpretadas em UTC). */
export function formatDate(isoDate) {
  return isoDate ? DATE_FORMATTER.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`)) : '';
}

/** "2026-01" → "jan. de 2026". */
export function formatMonth(isoMonth) {
  return isoMonth ? MONTH_FORMATTER.format(new Date(`${isoMonth}-01T00:00:00Z`)) : '';
}

/** Data e hora no fuso do navegador. */
export function formatDateTime(isoDateTime) {
  return isoDateTime ? DATE_TIME_FORMATTER.format(new Date(isoDateTime)) : '';
}

/** Mês atual no formato "AAAA-MM". */
export function currentIsoMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
