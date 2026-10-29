import { createContext, useContext } from 'react';

/**
 * Sessão da retaguarda:
 * { status: 'loading' | 'authenticated' | 'anonymous', admin, restaurant, login, logout, refresh }
 */
export const SessionContext = createContext(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession deve ser usado dentro de SessionProvider.');
  return session;
}
