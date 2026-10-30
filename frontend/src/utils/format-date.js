const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const DAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
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

/** Só a data de um instante (ex.: data de cadastro), no fuso do navegador. */
export function formatDayOf(isoDateTime) {
  return isoDateTime ? DAY_FORMATTER.format(new Date(isoDateTime)) : '';
}

/** Data e hora no fuso do navegador. */
export function formatDateTime(isoDateTime) {
  return isoDateTime ? DATE_TIME_FORMATTER.format(new Date(isoDateTime)) : '';
}

/** Mês atual no formato "AAAA-MM". */
export function currentIsoMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Data de hoje no fuso do navegador, "AAAA-MM-DD". */
export function todayIsoDate(now = new Date()) {
  return `${currentIsoMonth(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Mês deslocado: shiftIsoMonth("2026-01", -1) → "2025-12". */
export function shiftIsoMonth(isoMonth, delta) {
  const [year, month] = isoMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** Primeiro e último dia de um mês "AAAA-MM", como datas "AAAA-MM-DD". */
export function monthBounds(isoMonth) {
  const [year, month] = isoMonth.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${isoMonth}-01`, to: `${isoMonth}-${String(last).padStart(2, '0')}` };
}

/** Dias entre duas datas "AAAA-MM-DD" (positivo quando `to` é posterior). */
export function daysBetween(from, to) {
  const DAY = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}
