import { openSseStream } from '../../shared/utils/sse.js';
import * as menuService from './menu.service.js';

export async function getMenu(req, res) {
  const menu = await menuService.getPublicMenu(req.validated.params.slug);
  // O cardápio muda em tempo real: o navegador deve sempre revalidar.
  res.set('Cache-Control', 'no-cache');
  res.json({ data: menu });
}

/**
 * Stream SSE com as atualizações do cardápio de um único restaurante.
 * A cada (re)conexão envia "ready", sinalizando ao cliente que deve recarregar o cardápio.
 */
export async function streamMenuEvents(req, res) {
  let stream = null;
  const unsubscribe = await menuService.subscribeToPublicMenu(req.validated.params.slug, (event) =>
    stream?.send(event.type, event),
  );

  stream = openSseStream(res);
  stream.onClose(unsubscribe);
  stream.send('ready', { at: new Date().toISOString() });
}
