import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega um recurso da API e expõe estados de carregamento, erro e dados.
 * `setData` permite aplicar o resultado de uma mutação sem recarregar tudo.
 *
 * @param {(options: { signal: AbortSignal }) => Promise<any>} loader função estável (useCallback)
 */
export function useResource(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const controllerRef = useRef(null);

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((previous) => ({ ...previous, status: previous.data ? 'success' : 'loading' }));

    try {
      const data = await loader({ signal: controller.signal });
      if (!controller.signal.aborted) setState({ status: 'success', data, error: null });
    } catch (error) {
      if (!controller.signal.aborted) setState({ status: 'error', data: null, error });
    }
  }, [loader]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload]);

  const setData = useCallback(
    (updater) =>
      setState((previous) => ({
        ...previous,
        data: typeof updater === 'function' ? updater(previous.data) : updater,
      })),
    [],
  );

  return { ...state, reload, setData };
}
