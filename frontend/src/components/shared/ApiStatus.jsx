import { useApiHealth } from '../../hooks/useApiHealth.js';

const STATUS_STYLES = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  degraded: 'border-amber-200 bg-amber-50 text-amber-800',
  offline: 'border-red-200 bg-red-50 text-red-800',
  loading: 'border-slate-200 bg-white text-slate-600',
};

/** Exibe a conectividade frontend → API → PostgreSQL. */
export function ApiStatus() {
  const { status, health, error, refresh } = useApiHealth();

  let variant = 'loading';
  let message = 'Verificando conexão com a API...';
  if (status === 'error') {
    variant = 'offline';
    message = `API indisponível: ${error.message}`;
  } else if (status === 'success' && health.database === 'up') {
    variant = 'ok';
    message = 'API online e banco de dados conectado.';
  } else if (status === 'success') {
    variant = 'degraded';
    message = 'API online, mas o banco de dados está indisponível.';
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${STATUS_STYLES[variant]}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={refresh}
        disabled={status === 'loading'}
        className="rounded-md border border-current px-3 py-1 text-sm font-medium disabled:opacity-50"
      >
        Verificar novamente
      </button>
    </div>
  );
}
