import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, setUnauthorizedHandler } from '../../../services/api.js';
import { SessionContext } from '../hooks/useSession.js';

const ANONYMOUS = Object.freeze({ status: 'anonymous' });

/**
 * Carrega e mantém uma sessão autenticada (retaguarda ou backoffice).
 * `service` = { getCurrent, login, logout }. Os dados de getCurrent ficam no contexto.
 * Estados: loading | authenticated | anonymous | suspended | error.
 */
export function SessionProvider({ service, children }) {
  const [state, setState] = useState({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      setState({ status: 'authenticated', ...(await service.getCurrent()) });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setState(ANONYMOUS);
      else if (error?.code === 'RESTAURANT_SUSPENDED') setState({ status: 'suspended', error });
      else setState({ status: 'error', error });
    }
  }, [service]);

  useEffect(() => {
    refresh();
    // Qualquer 401 em rota protegida (ex.: sessão expirada) volta para o login.
    return setUnauthorizedHandler(() => setState(ANONYMOUS));
  }, [refresh]);

  const login = useCallback(
    async (credentials) => {
      await service.login(credentials);
      await refresh();
    },
    [service, refresh],
  );

  const logout = useCallback(async () => {
    try {
      await service.logout();
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
