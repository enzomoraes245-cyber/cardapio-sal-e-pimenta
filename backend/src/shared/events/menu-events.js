/**
 * Barramento em memória de atualizações do cardápio, segmentado por restaurante.
 *
 * Cada assinante recebe somente eventos do restaurante assinado. O evento é apenas
 * um sinal ("o cardápio mudou"): o cliente busca o cardápio publicado novamente,
 * de modo que nenhum dado administrativo trafega pelo canal público.
 *
 * Limitação conhecida: funciona em um único processo. Com várias instâncias da API
 * será necessário propagar os eventos (ex.: LISTEN/NOTIFY do PostgreSQL).
 */

export const MENU_UPDATED_EVENT = 'menu.updated';

const listenersByRestaurant = new Map();

/** Assina as atualizações de um restaurante. Retorna a função para cancelar a assinatura. */
export function subscribeToMenuUpdates(restaurantId, listener) {
  let listeners = listenersByRestaurant.get(restaurantId);
  if (!listeners) {
    listeners = new Set();
    listenersByRestaurant.set(restaurantId, listeners);
  }
  listeners.add(listener);

  return function unsubscribe() {
    listeners.delete(listener);
    if (listeners.size === 0) listenersByRestaurant.delete(restaurantId);
  };
}

/**
 * Notifica os assinantes de um restaurante que o cardápio publicado mudou.
 * Deve ser chamado pelos services administrativos após persistir alterações.
 * Retorna a quantidade de assinantes notificados.
 */
export function publishMenuUpdated(restaurantId) {
  const listeners = listenersByRestaurant.get(restaurantId);
  if (!listeners) return 0;

  const event = Object.freeze({ type: MENU_UPDATED_EVENT, at: new Date().toISOString() });
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error('[menu-events] Falha ao notificar assinante:', error);
    }
  }
  return listeners.size;
}

export function countMenuSubscribers(restaurantId) {
  return listenersByRestaurant.get(restaurantId)?.size ?? 0;
}
