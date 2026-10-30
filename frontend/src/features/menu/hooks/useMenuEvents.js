import { useEffect, useRef } from 'react';
import { MENU_UPDATED_EVENT, getMenuEventsUrl } from '../services/menu.service.js';

// Reconexão manual com recuo progressivo: 5 s, 10 s, 20 s, 40 s e depois a cada 60 s.
// Volta ao início quando a conexão é aceita ("ready").
const RECONNECT_DELAYS_MS = [5_000, 10_000, 20_000, 40_000, 60_000];
// O servidor envia "ping" a cada 20 s; sem nenhum evento por 45 s a conexão é considerada morta.
const STALE_CONNECTION_MS = 45_000;
// Alterações em sequência no painel (ex.: reordenar vários itens) viram uma única recarga.
const CHANGE_DEBOUNCE_MS = 300;

/**
 * Assina as atualizações em tempo real (SSE) do cardápio de um restaurante.
 *
 * - "menu.updated": o cardápio mudou → chama onMenuChanged (eventos em rajada são agrupados).
 * - "ready" após uma reconexão: eventos podem ter sido perdidos → chama onMenuChanged.
 * - "ping": heartbeat; sua ausência indica conexão meio aberta (ex.: rede móvel), que é refeita.
 * O EventSource reconecta sozinho; se a conexão for recusada ou encerrada de vez, reabre com
 * intervalos crescentes, para não sobrecarregar a API.
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
    let changeTimer = null;
    let disposed = false;
    let hasConnectedBefore = false;
    let failures = 0;

    function notifyChange() {
      clearTimeout(changeTimer);
      changeTimer = setTimeout(() => callbackRef.current?.(), CHANGE_DEBOUNCE_MS);
    }

    function watchForStaleConnection() {
      clearTimeout(staleTimer);
      staleTimer = setTimeout(() => {
        source?.close();
        connect();
      }, STALE_CONNECTION_MS);
    }

    function scheduleReconnect() {
      clearTimeout(staleTimer);
      const delay = RECONNECT_DELAYS_MS[Math.min(failures, RECONNECT_DELAYS_MS.length - 1)];
      failures += 1;
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      if (disposed) return;
      const current = new EventSource(getMenuEventsUrl(slug));
      source = current;
      watchForStaleConnection();

      current.addEventListener('ready', () => {
        failures = 0;
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
        scheduleReconnect();
      });
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      clearTimeout(staleTimer);
      clearTimeout(changeTimer);
      source?.close();
    };
  }, [slug, enabled]);
}
