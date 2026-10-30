import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductStatusToggles } from '../src/features/availability/components/ProductStatusToggles.jsx';

afterEach(cleanup);

describe('ProductStatusToggles', () => {
  it('mostra a situação atual como interruptores com nome estável', () => {
    render(
      <ProductStatusToggles
        product={{ name: 'Pudim', isActive: true, isAvailable: false }}
        onChange={() => {}}
      />,
    );

    // O nome acessível não muda com o estado (o estado é o aria-checked).
    const active = screen.getByRole('switch', { name: 'Ativo: Pudim' });
    const available = screen.getByRole('switch', { name: 'Disponível: Pudim' });
    expect(active.getAttribute('aria-checked')).toBe('true');
    expect(available.getAttribute('aria-checked')).toBe('false');
  });

  it('solicita a inversão do campo clicado', () => {
    const onChange = vi.fn();
    render(
      <ProductStatusToggles
        product={{ name: 'Pudim', isActive: true, isAvailable: true }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Disponível: Pudim' }));

    expect(onChange).toHaveBeenCalledWith('isAvailable', false);
  });
});
