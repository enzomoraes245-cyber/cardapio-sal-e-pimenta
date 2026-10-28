import { useCallback, useEffect, useState } from 'react';
import { getApiHealth } from '../services/health.service.js';

/** Estado do health check da API: { status: 'loading' | 'success' | 'error', health, error, refresh }. */
export function useApiHealth() {
  const [state, setState] = useState({ status: 'loading', health: null, error: null });

  const check = useCallback(async (signal) => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    try {
      const health = await getApiHealth({ signal });
      setState({ status: 'success', health, error: null });
    } catch (error) {
      if (signal?.aborted) return;
      setState({ status: 'error', health: null, error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    return () => controller.abort();
  }, [check]);

  return { ...state, refresh: () => check() };
}
