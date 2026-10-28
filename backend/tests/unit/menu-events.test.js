import { describe, expect, it, vi } from 'vitest';
import {
  MENU_UPDATED_EVENT,
  countMenuSubscribers,
  publishMenuUpdated,
  subscribeToMenuUpdates,
} from '../../src/shared/events/menu-events.js';

describe('menu-events', () => {
  it('entrega o evento somente aos assinantes do restaurante correspondente', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubscribeA = subscribeToMenuUpdates('restaurant-a', listenerA);
    const unsubscribeB = subscribeToMenuUpdates('restaurant-b', listenerB);

    const notified = publishMenuUpdated('restaurant-a');

    expect(notified).toBe(1);
    expect(listenerA).toHaveBeenCalledWith(expect.objectContaining({ type: MENU_UPDATED_EVENT }));
    expect(listenerB).not.toHaveBeenCalled();

    unsubscribeA();
    unsubscribeB();
  });

  it('remove o assinante ao cancelar a inscrição', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToMenuUpdates('restaurant-c', listener);
    expect(countMenuSubscribers('restaurant-c')).toBe(1);

    unsubscribe();
    publishMenuUpdated('restaurant-c');

    expect(countMenuSubscribers('restaurant-c')).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('continua notificando os demais assinantes quando um deles falha', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = vi.fn(() => {
      throw new Error('falha');
    });
    const healthy = vi.fn();
    const unsubscribeFailing = subscribeToMenuUpdates('restaurant-d', failing);
    const unsubscribeHealthy = subscribeToMenuUpdates('restaurant-d', healthy);

    publishMenuUpdated('restaurant-d');

    expect(healthy).toHaveBeenCalledOnce();
    unsubscribeFailing();
    unsubscribeHealthy();
    vi.restoreAllMocks();
  });
});
