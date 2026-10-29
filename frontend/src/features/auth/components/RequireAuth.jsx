import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { useSession } from '../hooks/useSession.js';

/** Protege as rotas da retaguarda: sem sessão, redireciona para o login (RN-001). */
export function RequireAuth() {
  const { status, refresh } = useSession();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Verificando sessão..." />;
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
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
