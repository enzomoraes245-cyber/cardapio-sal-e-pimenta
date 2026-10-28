import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicMenu } from '../services/menu.service.js';

const INITIAL_STATE = Object.freeze({ status: 'loading', menu: null, error: null });

/**
 * Carrega o cardápio público de um restaurante.
 * `reload` pode ser chamado a qualquer momento (ex.: evento SSE): o cardápio já exibido
 * permanece na tela durante a atualização e também se ela falhar.
 */
export function usePublicMenu(slug) {
  const [state, setState] = useState({ slug, ...INITIAL_STATE });
  const controllerRef = useRef(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((previous) =>
      previous.slug === slug && previous.status === 'error'
        ? { ...previous, status: 'loading' }
        : previous,
    );

    try {
      const menu = await getPublicMenu(slug, { signal: controller.signal });
      if (!controller.signal.aborted) setState({ slug, status: 'success', menu, error: null });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((previous) =>
        previous.slug === slug && previous.menu
          ? { ...previous, error }
          : { slug, status: 'error', menu: null, error },
      );
    }
  }, [slug]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload]);

  // Ao trocar de restaurante, nunca exibe o cardápio anterior.
  if (state.slug !== slug) return { ...INITIAL_STATE, reload };
  return { status: state.status, menu: state.menu, error: state.error, reload };
}
