import { Navigate, Outlet, useLocation } from 'react-router';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { InlineSpinner } from '../../../components/admin/InlineSpinner.jsx';
import { LogoutIcon, RefreshIcon } from '../../../components/admin/icons.jsx';
import { RESTAURANT_AREA } from '../areas.js';
import { useSession } from '../hooks/useSession.js';
import { AuthLayout } from './AuthLayout.jsx';

const BLOCKED_STATES = {
  suspended: 'Acesso suspenso',
  blocked: 'Acesso bloqueado',
};

/** Protege as rotas autenticadas: sem sessão, redireciona para o login da área (RN-001). */
export function RequireAuth({ area = RESTAURANT_AREA }) {
  const { status, error, refresh, logout } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="flex min-h-dvh items-center justify-center gap-3 bg-admin-canvas font-admin text-sm text-admin-muted"
      >
        <InlineSpinner size={18} />
        Verificando sessão...
      </div>
    );
  }

  if (BLOCKED_STATES[status]) {
    return (
      <AuthLayout area={area} title={BLOCKED_STATES[status]}>
        <Alert tone="danger">{error.message}</Alert>
        <Button variant="secondary" icon={LogoutIcon} onClick={logout}>
          Sair
        </Button>
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout area={area} title="Não foi possível verificar a sessão">
        <Alert tone="danger">Verifique sua conexão e tente novamente.</Alert>
        <Button variant="secondary" icon={RefreshIcon} onClick={refresh}>
          Tentar novamente
        </Button>
      </AuthLayout>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to={area.loginPath} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
