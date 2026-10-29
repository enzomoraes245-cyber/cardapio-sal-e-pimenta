import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { useSession } from '../hooks/useSession.js';

/** Protege as rotas autenticadas: sem sessão, redireciona para `loginPath` (RN-001). */
export function RequireAuth({ loginPath }) {
  const { status, error, refresh, logout } = useSession();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Verificando sessão..." />;
  if (status === 'suspended') {
    return (
      <StatusMessage
        tone="error"
        title="Acesso suspenso"
        description={error.message}
        action={{ label: 'Sair', onClick: logout }}
      />
    );
  }
  if (status === 'error') {
    return (
      <StatusMessage
        tone="error"
        title="Não foi possível verificar a sessão"
        description="Verifique sua conexão e tente novamente."
        action={{ label: 'Tentar novamente', onClick: refresh }}
      />
    );
  }
  if (status === 'anonymous') {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
