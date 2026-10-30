import { Field, Select, TextInput } from '../../../../components/admin/Field.jsx';
import { ALL_TIME_PRESET, PERIOD_PRESETS, resolvePeriod } from '../utils/period.js';

/**
 * Escolha do período (este mês, mês anterior, personalizado e, opcionalmente, todo o período).
 * `onChange({ preset, from, to })` recebe o novo estado; as datas só valem no personalizado.
 */
export function PeriodFilter({ preset, from, to, onChange, allowAll = false }) {
  const presets = allowAll ? [...PERIOD_PRESETS, ALL_TIME_PRESET] : PERIOD_PRESETS;
  const range = resolvePeriod({ preset, from, to });

  function selectPreset(value) {
    // Ao abrir o personalizado, começa pelo período que estava na tela.
    onChange(
      value === 'personalizado'
        ? { preset: value, ...resolvePeriod({ preset }) }
        : { preset: value },
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Field label="Período" className="w-full sm:w-48">
        <Select value={preset} onChange={(event) => selectPreset(event.target.value)}>
          {presets.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
      {preset === 'personalizado' && (
        <>
          <Field label="De" className="w-[calc(50%-0.375rem)] sm:w-44">
            <TextInput
              type="date"
              value={from ?? ''}
              max={to || undefined}
              onChange={(event) => onChange({ preset, from: event.target.value, to })}
            />
          </Field>
          <Field
            label="Até"
            className="w-[calc(50%-0.375rem)] sm:w-44"
            error={range.invalid ? 'Informe um período válido.' : undefined}
          >
            <TextInput
              type="date"
              value={to ?? ''}
              min={from || undefined}
              onChange={(event) => onChange({ preset, from, to: event.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  );
}
