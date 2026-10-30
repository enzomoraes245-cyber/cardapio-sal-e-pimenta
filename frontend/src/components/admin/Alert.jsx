import { cx } from './cx.js';
import { AlertCircleIcon, AlertTriangleIcon, CircleCheckIcon, InfoIcon } from './icons.jsx';

const TONES = {
  info: {
    box: 'border-admin-line bg-admin-subtle',
    icon: InfoIcon,
    iconClass: 'text-admin-muted',
  },
  success: {
    box: 'border-admin-success/25 bg-admin-success-soft',
    icon: CircleCheckIcon,
    iconClass: 'text-admin-success',
  },
  warning: {
    box: 'border-admin-warning/30 bg-admin-warning-soft',
    icon: AlertTriangleIcon,
    iconClass: 'text-admin-warning',
  },
  danger: {
    box: 'border-admin-danger/25 bg-admin-danger-soft',
    icon: AlertCircleIcon,
    iconClass: 'text-admin-danger',
  },
};

/**
 * Mensagem em destaque com ícone e texto (nunca só cor).
 * Erros usam role="alert" e confirmações role="status", salvo `role` explícito.
 */
export function Alert({ tone = 'info', title, children, action, role, className }) {
  const { box, icon: Icon, iconClass } = TONES[tone];
  const defaultRole = tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined;
  return (
    <div
      role={role ?? defaultRole}
      className={cx('flex gap-3 rounded-admin-panel border px-4 py-3 text-sm', box, className)}
    >
      <Icon size={18} className={cx('mt-px shrink-0', iconClass)} />
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-semibold text-admin-text">{title}</p>}
        {children && (
          <div className={cx('leading-relaxed', title ? 'text-admin-muted' : 'text-admin-text')}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** Retorno de envio de formulário: `{ tone: 'success' | 'error', message }`. */
export function FormFeedback({ feedback, className }) {
  if (!feedback) return null;
  return (
    <Alert tone={feedback.tone === 'error' ? 'danger' : 'success'} className={className}>
      {feedback.message}
    </Alert>
  );
}
