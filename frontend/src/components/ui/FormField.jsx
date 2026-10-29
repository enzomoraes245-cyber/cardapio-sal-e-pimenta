import { cloneElement, useId } from 'react';

/**
 * Campo de formulário acessível: associa rótulo, dica e erro ao controle filho.
 * O filho (input, select, textarea) recebe id, aria-invalid e aria-describedby.
 */
export function FormField({ label, hint, error, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Classes padrão para inputs da retaguarda. */
export const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:outline-none aria-invalid:border-red-600';
