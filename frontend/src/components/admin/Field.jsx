import { cloneElement, useId } from 'react';
import { cx } from './cx.js';
import { AlertCircleIcon, ChevronDownIcon } from './icons.jsx';

/** Classes dos controles de formulário (16 px no celular evita o zoom automático do iOS). */
export const inputClass =
  'block min-h-10 w-full rounded-admin-control border border-admin-line-strong bg-admin-surface px-3 py-2 text-base text-admin-text shadow-admin-raise transition-[border-color,box-shadow] duration-150 placeholder:text-admin-faint/80 hover:border-admin-faint/60 focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/15 focus:outline-none aria-invalid:border-admin-danger aria-invalid:focus:ring-admin-danger/15 disabled:cursor-not-allowed disabled:bg-admin-subtle disabled:text-admin-faint sm:text-sm';

/**
 * Campo de formulário acessível: associa rótulo, dica e erro ao controle filho.
 * O filho recebe id, aria-invalid, aria-describedby e aria-required. `hideLabel` mantém o rótulo
 * só para leitores de tela (quando o contexto visual já identifica o campo).
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  optional = false,
  hideLabel = false,
  action,
  className,
  children,
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('space-y-1.5', className)}>
      <div className={cx('flex items-baseline justify-between gap-3', hideLabel && 'sr-only')}>
        <label htmlFor={id} className="text-sm font-medium text-admin-text">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-admin-danger">
              *
            </span>
          )}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-admin-faint">(opcional)</span>
          )}
        </label>
        {action}
      </div>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-admin-faint">
          {hint}
        </p>
      )}
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

export function TextInput({ className, ...props }) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea rows={rows} className={cx(inputClass, 'leading-relaxed', className)} {...props} />
  );
}

/** Lista de opções nativa com seta própria; os atributos chegam ao <select>. */
export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cx(inputClass, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-admin-faint"
      />
    </div>
  );
}

/** Campo com prefixo fixo (ex.: "R$"); os atributos chegam ao <input>. */
export function AffixInput({ prefix, className, ...props }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-admin-faint"
      >
        {prefix}
      </span>
      <input className={cx(inputClass, 'pl-10 tabular-nums', className)} {...props} />
    </div>
  );
}

export function Checkbox({ label, description, className, ...props }) {
  const id = useId();
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <input
        id={id}
        type="checkbox"
        aria-describedby={description ? `${id}-description` : undefined}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-admin-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium text-admin-text">{label}</span>
        {description && (
          <span id={`${id}-description`} className="mt-0.5 block text-[13px] text-admin-muted">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

/**
 * Interruptor (role="switch"). O rótulo descreve o que é ligado ("Disponível"); o estado vem do
 * próprio controle (aria-checked), então o nome acessível não muda ao alternar.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  hideLabel = false,
  disabled = false,
  className,
  ...props
}) {
  const id = useId();
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={description && !hideLabel ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'border-admin-accent bg-admin-accent'
            : 'border-admin-line-strong bg-admin-neutral-soft',
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cx(
            'inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-150',
            checked ? 'translate-x-[21px]' : 'translate-x-[2px]',
          )}
        />
      </button>
      {!hideLabel && (
        <span className="text-sm">
          <label htmlFor={id} className="cursor-pointer font-medium text-admin-text">
            {label}
          </label>
          {description && (
            <span id={`${id}-description`} className="mt-0.5 block text-[13px] text-admin-muted">
              {description}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/** Campo com complemento fixo à esquerda (ex.: "/cardapio/"); os atributos chegam ao <input>. */
export function AddonInput({ addon, className, ...props }) {
  return (
    <div className="flex">
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center rounded-l-admin-control border border-r-0 border-admin-line-strong bg-admin-subtle px-3 text-sm text-admin-faint"
      >
        {addon}
      </span>
      <input className={cx(inputClass, 'min-w-0 rounded-l-none', className)} {...props} />
    </div>
  );
}
