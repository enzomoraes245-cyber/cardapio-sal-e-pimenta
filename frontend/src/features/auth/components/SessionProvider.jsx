import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, setSessionErrorHandler } from '../../../services/api.js';
import { SessionContext } from '../hooks/useSession.js';

const ANONYMOUS = Object.freeze({ status: 'anonymous' });

/** Estado da sessão a partir de um erro da API (null se não for erro de sessão). */
function stateFromError(error) {
  if (error instanceof ApiError && error.status === 401) return ANONYMOUS;
  if (error?.code === 'RESTAURANT_SUSPENDED') return { status: 'suspended', error };
  if (error?.code === 'USER_DISABLED') return { status: 'blocked', error };
  return null;
}

/**
 * Carrega e mantém uma sessão autenticada (retaguarda ou backoffice).
 * `service` = { getCurrent, login, logout }. Os dados de getCurrent ficam no contexto.
 * Estados: loading | authenticated | anonymous | suspended | blocked | error.
 * Um 401, suspensão ou bloqueio recebido durante o uso atualiza o estado na hora.
 */
export function SessionProvider({ service, children }) {
  const [state, setState] = useState({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      setState({ status: 'authenticated', ...(await service.getCurrent()) });
    } catch (error) {
      setState(stateFromError(error) ?? { status: 'error', error });
    }
  }, [service]);

  useEffect(() => {
    refresh();
    return setSessionErrorHandler((error) => {
      const next = stateFromError(error);
      if (next) setState(next);
    });
  }, [refresh]);

  const login = useCallback(
    async (credentials) => {
      await service.login(credentials);
      await refresh();
    },
    [service, refresh],
  );

  // Sair nunca falha para quem usa: mesmo sem resposta da API, a sessão local termina.
  const logout = useCallback(async () => {
    try {
      await service.logout();
    } catch {
      // A sessão expira sozinha no servidor; o importante é sair da interface.
    } finally {
      setState(ANONYMOUS);
    }
  }, [service]);

  const value = useMemo(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
