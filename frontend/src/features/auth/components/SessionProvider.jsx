import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, setUnauthorizedHandler } from '../../../services/api.js';
import { SessionContext } from '../hooks/useSession.js';
import * as authService from '../services/auth.service.js';

const ANONYMOUS = Object.freeze({ status: 'anonymous', admin: null, restaurant: null });

/** Carrega e mantém a sessão do administrador. Usado apenas na área /admin. */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', admin: null, restaurant: null });

  const refresh = useCallback(async () => {
    try {
      const current = await authService.getCurrentAdmin();
      setState({ status: 'authenticated', ...current });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setState(ANONYMOUS);
      else setState({ ...ANONYMOUS, status: 'error', error });
    }
  }, []);

  useEffect(() => {
    refresh();
    // Qualquer 401 em rota administrativa (ex.: sessão expirada) volta para o login.
    return setUnauthorizedHandler(() => setState(ANONYMOUS));
  }, [refresh]);

  const login = useCallback(
    async (credentials) => {
      await authService.login(credentials);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState(ANONYMOUS);
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
