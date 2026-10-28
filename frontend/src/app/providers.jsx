import { StrictMode } from 'react';

/** Ponto único para providers globais da aplicação (sessão, tema etc., quando necessários). */
export function AppProviders({ children }) {
  return <StrictMode>{children}</StrictMode>;
}
