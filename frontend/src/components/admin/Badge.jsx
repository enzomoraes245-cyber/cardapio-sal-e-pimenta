import { cx } from './cx.js';

const TONES = {
  neutral: {
    box: 'bg-admin-neutral-soft text-admin-neutral ring-admin-line-strong/70',
    dot: 'bg-admin-faint',
  },
  success: {
    box: 'bg-admin-success-soft text-admin-success ring-admin-success/20',
    dot: 'bg-admin-success',
  },
  warning: {
    box: 'bg-admin-warning-soft text-admin-warning ring-admin-warning/25',
    dot: 'bg-admin-warning',
  },
  danger: {
    box: 'bg-admin-danger-soft text-admin-danger ring-admin-danger/20',
    dot: 'bg-admin-danger',
  },
  accent: {
    box: 'bg-admin-accent-soft text-admin-accent ring-admin-accent/20',
    dot: 'bg-admin-accent',
  },
};

/** Indicador de situação: ponto (ou ícone) + texto, para não depender só da cor. */
export function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  const { box, dot } = TONES[tone];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        box,
        className,
      )}
    >
      {Icon ? (
        <Icon size={13} />
      ) : (
        <span aria-hidden="true" className={cx('size-1.5 shrink-0 rounded-full', dot)} />
      )}
      {children}
    </span>
  );
}
