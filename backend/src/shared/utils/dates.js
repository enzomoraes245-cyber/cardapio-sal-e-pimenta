import { env } from '../../config/env.js';

/**
 * Data de hoje no fuso do negócio (APP_TIMEZONE), como meia-noite UTC — o mesmo formato das
 * colunas DATE. Em UTC a data "vira" às 21h de Brasília, o que antecipava vencimentos.
 */
export function businessToday(now = new Date(), timeZone = env.APP_TIMEZONE) {
  const isoDate = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${isoDate}T00:00:00.000Z`);
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

/** "AAAA-MM-DD" → data (meia-noite UTC), no formato das colunas DATE. */
export function parseIsoDate(isoDate) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
