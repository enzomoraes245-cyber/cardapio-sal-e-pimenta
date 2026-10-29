import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductStatusToggles } from '../src/features/availability/components/ProductStatusToggles.jsx';

afterEach(cleanup);

describe('ProductStatusToggles', () => {
  it('mostra a situação atual como interruptores acessíveis', () => {
    render(
      <ProductStatusToggles
        product={{ name: 'Pudim', isActive: true, isAvailable: false }}
        onChange={() => {}}
      />,
    );

    const [active, available] = screen.getAllByRole('switch');
    expect(active.getAttribute('aria-checked')).toBe('true');
    expect(active.textContent).toBe('Ativo');
    expect(available.getAttribute('aria-checked')).toBe('false');
    expect(available.textContent).toBe('Indisponível');
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
