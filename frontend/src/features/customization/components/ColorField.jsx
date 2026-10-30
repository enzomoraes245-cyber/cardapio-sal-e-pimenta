import { useId } from 'react';
import { inputClass } from '../../../components/admin/Field.jsx';

/** Seletor de cor com campo de texto #RRGGBB sincronizado. */
export function ColorField({ label, hint, value, onChange, error }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} (seletor)`}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white"
        />
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
          className={`${inputClass} max-w-32 font-mono`}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate-500">
        {hint}
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
