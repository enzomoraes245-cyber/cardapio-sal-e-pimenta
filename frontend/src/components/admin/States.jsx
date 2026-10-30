import { Button } from './Button.jsx';
import { cx } from './cx.js';
import { AlertCircleIcon, RefreshIcon } from './icons.jsx';

/** Bloco de carregamento com linhas esqueleto; o texto fica disponível para leitores de tela. */
export function LoadingState({ label = 'Carregando...', rows = 3, className }) {
  return (
    <div role="status" aria-live="polite" className={cx('space-y-3', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 rounded-admin-panel" />
      ))}
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'animate-pulse rounded-md bg-admin-line/70 motion-reduce:animate-none',
        className,
      )}
    />
  );
}

/** Ausência de dados com explicação curta e, quando fizer sentido, a ação para começar. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 rounded-admin-panel border border-dashed border-admin-line-strong bg-admin-surface px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="flex size-11 items-center justify-center rounded-full bg-admin-accent-soft text-admin-accent">
          <Icon size={22} />
        </span>
      )}
      <div className="max-w-sm space-y-1">
        <p className="font-semibold text-admin-text">{title}</p>
        {description && <p className="text-sm leading-relaxed text-admin-muted">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

/** Falha ao carregar, com a mensagem recebida e "Tentar novamente". */
export function ErrorState({ title = 'Não foi possível carregar', error, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cx(
        'flex flex-col items-center gap-3 rounded-admin-panel border border-admin-danger/20 bg-admin-danger-soft/70 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-admin-surface text-admin-danger ring-1 ring-admin-danger/20">
        <AlertCircleIcon />
      </span>
      <div className="max-w-md space-y-1">
        <p className="font-semibold text-admin-text">{title}</p>
        {error?.message && <p className="text-sm text-admin-muted">{error.message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshIcon} onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
