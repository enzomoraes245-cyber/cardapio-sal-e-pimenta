import { Link } from 'react-router';
import { cx } from './cx.js';
import { InlineSpinner } from './InlineSpinner.jsx';

const BASE =
  'inline-flex shrink-0 items-center justify-center rounded-admin-control font-medium whitespace-nowrap transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed';

const VARIANTS = {
  primary:
    'bg-admin-accent text-white shadow-admin-raise hover:bg-admin-accent-hover disabled:bg-admin-accent/45',
  secondary:
    'border border-admin-line-strong bg-admin-surface text-admin-text shadow-admin-raise hover:border-admin-faint/50 hover:bg-admin-subtle disabled:text-admin-faint disabled:hover:bg-admin-surface',
  ghost:
    'text-admin-muted hover:bg-admin-neutral-soft hover:text-admin-text disabled:text-admin-faint/70 disabled:hover:bg-transparent',
  danger:
    'bg-admin-danger text-white shadow-admin-raise hover:bg-admin-danger-hover disabled:bg-admin-danger/45',
  'danger-outline':
    'border border-admin-danger/30 bg-admin-surface text-admin-danger shadow-admin-raise hover:border-admin-danger/50 hover:bg-admin-danger-soft disabled:opacity-50',
  'danger-ghost':
    'text-admin-danger hover:bg-admin-danger-soft disabled:text-admin-danger/50 disabled:hover:bg-transparent',
};

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-[15px]',
};

const ICON_ONLY_SIZES = { sm: 'size-8', md: 'size-10', lg: 'size-11' };
const ICON_SIZES = { sm: 16, md: 18, lg: 18 };

/** Classes de botão, também usadas por links com aparência de botão. */
export function buttonClasses({ variant = 'primary', size = 'md', block = false, className } = {}) {
  return cx(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className);
}

/**
 * Botão das áreas administrativas. `type` padrão é "button" (evita envios acidentais);
 * `loading` desabilita o botão, troca o ícone por um indicador e marca aria-busy.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  icon: Icon,
  block = false,
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, block, className })}
      {...props}
    >
      {loading ? (
        <InlineSpinner size={ICON_SIZES[size] - 2} />
      ) : (
        Icon && <Icon size={ICON_SIZES[size]} />
      )}
      {children}
    </button>
  );
}

/** Link com aparência de botão: rota interna (`to`) ou endereço externo (`href`). */
export function LinkButton({
  to,
  href,
  external = false,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  block = false,
  className,
  children,
  ...props
}) {
  const classes = buttonClasses({ variant, size, block, className });
  const content = (
    <>
      {Icon && <Icon size={ICON_SIZES[size]} />}
      {children}
      {external && <span className="sr-only"> (abre em nova aba)</span>}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        {...props}
      >
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={classes} {...props}>
      {content}
    </Link>
  );
}

/** Botão só com ícone: o rótulo vira aria-label e dica (title). */
export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(BASE, VARIANTS[variant], ICON_ONLY_SIZES[size], className)}
      {...props}
    >
      <Icon size={ICON_SIZES[size]} />
    </button>
  );
}
