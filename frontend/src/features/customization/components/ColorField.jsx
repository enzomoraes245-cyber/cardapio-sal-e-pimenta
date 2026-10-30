import { useId } from 'react';
import { inputClass } from '../../../components/admin/Field.jsx';
import { AlertCircleIcon } from '../../../components/admin/icons.jsx';

/** Seletor de cor com campo de texto #RRGGBB sincronizado; dica e erro ligados ao campo. */
export function ColorField({ label, hint, value, onChange, error }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-admin-text">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label}: escolher na paleta`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-admin-control border border-admin-line-strong bg-admin-surface p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
        />
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className={`${inputClass} max-w-32 font-mono uppercase`}
        />
      </div>
      <p id={hintId} className="text-xs leading-relaxed text-admin-faint">
        {hint}
      </p>
      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-[13px] font-medium text-admin-danger"
        >
          <AlertCircleIcon size={16} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
