/** Intervalo do evento "ping". O frontend considera a conexão morta após ~2x este valor. */
export const HEARTBEAT_INTERVAL_MS = 20_000;
const CLIENT_RETRY_MS = 3_000;

/**
 * Abre um stream Server-Sent Events na resposta HTTP.
 * Envia o evento "ping" periodicamente: mantém proxies abertos e permite ao cliente
 * detectar conexões meio abertas (comentários SSE não chegam ao EventSource).
 * Também informa ao navegador o intervalo de reconexão automática.
 */
export function openSseStream(res, { heartbeatMs = HEARTBEAT_INTERVAL_MS } = {}) {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`retry: ${CLIENT_RETRY_MS}\n\n`);

  let closed = false;
  const closeHandlers = new Set();
  const heartbeat = setInterval(() => res.write('event: ping\ndata: {}\n\n'), heartbeatMs);

  res.on('close', () => {
    closed = true;
    clearInterval(heartbeat);
    for (const handler of closeHandlers) handler();
    closeHandlers.clear();
  });

  return {
    send(event, data) {
      if (closed) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    onClose(handler) {
      if (closed) handler();
      else closeHandlers.add(handler);
    },
  };
}
