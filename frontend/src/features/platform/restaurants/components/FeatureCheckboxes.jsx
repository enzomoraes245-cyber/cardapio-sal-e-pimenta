import { FEATURE_LABELS } from '../utils/feature-labels.js';

/** Liberação dos módulos (DEC-006). `value` = { customization, qrcode, realtime, productModal }. */
export function FeatureCheckboxes({ value, onChange, disabled }) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">Módulos liberados</legend>
      {FEATURE_LABELS.map(({ key, label, hint }) => (
        <label key={key} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
          />
          <span>
            <span className="font-medium text-slate-900">{label}</span>
            <span className="block text-slate-500">{hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
