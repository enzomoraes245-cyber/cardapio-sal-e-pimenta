import { useEffect, useRef } from 'react';
import { MENU_UPDATED_EVENT, getMenuEventsUrl } from '../services/menu.service.js';

const MANUAL_RECONNECT_DELAY_MS = 5_000;
// O servidor envia "ping" a cada 20 s; sem nenhum evento por 45 s a conexão é considerada morta.
const STALE_CONNECTION_MS = 45_000;

/**
 * Assina as atualizações em tempo real (SSE) do cardápio de um restaurante.
 *
 * - "menu.updated": o cardápio mudou → chama onMenuChanged.
 * - "ready" após uma reconexão: eventos podem ter sido perdidos → chama onMenuChanged.
 * - "ping": heartbeat; sua ausência indica conexão meio aberta (ex.: rede móvel), que é refeita.
 * O EventSource reconecta sozinho; se a conexão for encerrada de vez, reabre após alguns segundos.
 */
export function useMenuEvents(slug, onMenuChanged, { enabled = true } = {}) {
  const callbackRef = useRef(onMenuChanged);

  useEffect(() => {
    callbackRef.current = onMenuChanged;
  }, [onMenuChanged]);

  useEffect(() => {
    if (!enabled || !slug || typeof EventSource === 'undefined') return undefined;

    let source = null;
    let reconnectTimer = null;
    let staleTimer = null;
    let disposed = false;
    let hasConnectedBefore = false;

    const notifyChange = () => callbackRef.current?.();

    function watchForStaleConnection() {
      clearTimeout(staleTimer);
      staleTimer = setTimeout(() => {
        source?.close();
        connect();
      }, STALE_CONNECTION_MS);
    }

    function connect() {
      if (disposed) return;
      const current = new EventSource(getMenuEventsUrl(slug));
      source = current;
      watchForStaleConnection();

      current.addEventListener('ready', () => {
        watchForStaleConnection();
        if (hasConnectedBefore) notifyChange();
        hasConnectedBefore = true;
      });
      current.addEventListener('ping', watchForStaleConnection);
      current.addEventListener(MENU_UPDATED_EVENT, () => {
        watchForStaleConnection();
        notifyChange();
      });
      current.addEventListener('error', () => {
        if (current.readyState !== EventSource.CLOSED || disposed) return;
        clearTimeout(staleTimer);
        reconnectTimer = setTimeout(connect, MANUAL_RECONNECT_DELAY_MS);
      });
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      clearTimeout(staleTimer);
      source?.close();
    };
  }, [slug, enabled]);
}
