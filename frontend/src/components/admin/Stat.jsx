import { Link } from 'react-router';
import { cx } from './cx.js';
import { ChevronRightIcon } from './icons.jsx';

const ICON_TONES = {
  neutral: 'bg-admin-neutral-soft text-admin-neutral',
  accent: 'bg-admin-accent-soft text-admin-accent',
  success: 'bg-admin-success-soft text-admin-success',
  warning: 'bg-admin-warning-soft text-admin-warning',
  danger: 'bg-admin-danger-soft text-admin-danger',
};

/**
 * Indicador numérico com a definição visível do que é contado, para não haver dúvida sobre o
 * critério (ex.: "Mensalidades em aberto com vencimento anterior a hoje").
 */
export function Stat({
  label,
  value,
  detail,
  definition,
  icon: Icon,
  tone = 'neutral',
  to,
  linkLabel,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-admin-panel border border-admin-line bg-admin-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-admin-muted">{label}</p>
        {Icon && (
          <span
            className={cx(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              ICON_TONES[tone],
            )}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[28px] leading-none font-semibold tracking-tight text-admin-text tabular-nums">
          {value}
        </p>
        {detail && <p className="text-sm text-admin-muted tabular-nums">{detail}</p>}
      </div>
      {(definition || to) && (
        <div className="mt-auto space-y-2 border-t border-admin-line pt-3">
          {definition && <p className="text-xs leading-relaxed text-admin-faint">{definition}</p>}
          {to && (
            <Link
              to={to}
              className="inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-admin-accent hover:text-admin-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
            >
              {linkLabel}
              <ChevronRightIcon size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
