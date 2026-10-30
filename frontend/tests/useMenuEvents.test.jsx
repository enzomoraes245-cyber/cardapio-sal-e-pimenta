import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuEvents } from '../src/features/menu/hooks/useMenuEvents.js';

/** EventSource falso: os testes disparam os eventos e as falhas manualmente. */
class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = FakeEventSource.CONNECTING;
    this.listeners = {};
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, listener) {
    (this.listeners[type] ??= []).push(listener);
  }

  emit(type) {
    if (type === 'ready') this.readyState = FakeEventSource.OPEN;
    for (const listener of this.listeners[type] ?? []) listener({});
  }

  /** Conexão recusada ou encerrada de vez (ex.: 403/500): o navegador não reconecta sozinho. */
  fail() {
    this.readyState = FakeEventSource.CLOSED;
    this.emit('error');
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
    this.closed = true;
  }
}

const sources = () => FakeEventSource.instances;
const latest = () => sources().at(-1);

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.useFakeTimers();
  vi.stubGlobal('EventSource', FakeEventSource);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useMenuEvents', () => {
  it('reconecta com intervalos crescentes e volta ao início quando a conexão é aceita', () => {
    renderHook(() => useMenuEvents('demo', vi.fn()));
    expect(sources()).toHaveLength(1);
    expect(latest().url).toContain('/public/restaurants/demo/events');

    for (const [index, delay] of [5_000, 10_000, 20_000, 40_000, 60_000, 60_000].entries()) {
      act(() => latest().fail());
      advance(delay - 1);
      expect(sources()).toHaveLength(index + 1);
      advance(1);
      expect(sources()).toHaveLength(index + 2);
    }

    act(() => latest().emit('ready'));
    act(() => latest().fail());
    advance(5_000);
    expect(sources()).toHaveLength(8);
  });

  it('agrupa atualizações em rajada numa única recarga', () => {
    const onChange = vi.fn();
    renderHook(() => useMenuEvents('demo', onChange));
    act(() => latest().emit('ready'));

    act(() => {
      latest().emit('menu.updated');
      latest().emit('menu.updated');
      latest().emit('menu.updated');
    });
    advance(299);
    expect(onChange).not.toHaveBeenCalled();
    advance(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('recarrega depois de uma reconexão, quando eventos podem ter sido perdidos', () => {
    const onChange = vi.fn();
    renderHook(() => useMenuEvents('demo', onChange));
    act(() => latest().emit('ready'));
    advance(1_000);
    expect(onChange).not.toHaveBeenCalled();

    act(() => latest().fail());
    advance(5_000);
    act(() => latest().emit('ready'));
    advance(300);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('não conecta quando desligado e encerra tudo ao desmontar', () => {
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useMenuEvents('demo', vi.fn(), { enabled }),
      { initialProps: { enabled: false } },
    );
    expect(sources()).toHaveLength(0);

    rerender({ enabled: true });
    expect(sources()).toHaveLength(1);
    act(() => latest().fail());
    unmount();

    expect(sources()[0].closed).toBe(true);
    advance(60_000);
    expect(sources()).toHaveLength(1);
  });
});
