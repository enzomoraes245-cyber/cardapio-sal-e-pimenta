import { currentIsoMonth, monthBounds, shiftIsoMonth } from '../../../../utils/format-date.js';

/** Períodos de consulta de pagamentos (valor na URL em ?periodo=). */
export const PERIOD_PRESETS = [
  { value: 'este-mes', label: 'Este mês' },
  { value: 'mes-anterior', label: 'Mês anterior' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const ALL_TIME_PRESET = { value: 'todos', label: 'Todo o período' };

/**
 * Datas "AAAA-MM-DD" do período escolhido. Intervalo personalizado incompleto ou invertido cai
 * no mês atual e vem marcado como `invalid`, para a tela avisar.
 */
export function resolvePeriod({ preset, from, to }, now = new Date()) {
  const current = currentIsoMonth(now);
  if (preset === 'mes-anterior') return monthBounds(shiftIsoMonth(current, -1));
  if (preset === 'todos') return { from: undefined, to: undefined };
  if (preset === 'personalizado') {
    if (from && to && from <= to) return { from, to };
    return { ...monthBounds(current), invalid: true };
  }
  return monthBounds(current);
}
