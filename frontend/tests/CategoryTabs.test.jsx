import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryTabs } from '../src/features/menu/components/CategoryTabs.jsx';

const CATEGORIES = [
  { id: 'entradas', name: 'Entradas' },
  { id: 'bebidas', name: 'Bebidas' },
];

afterEach(cleanup);

describe('CategoryTabs', () => {
  it('indica a categoria selecionada de forma acessível', () => {
    render(<CategoryTabs categories={CATEGORIES} selectedId="bebidas" onSelect={() => {}} />);

    expect(screen.getByRole('navigation', { name: 'Categorias' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bebidas' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todas' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('notifica a seleção, usando null para "Todas"', () => {
    const onSelect = vi.fn();
    render(<CategoryTabs categories={CATEGORIES} selectedId={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Entradas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'entradas');
    expect(onSelect).toHaveBeenNthCalledWith(2, null);
  });
});
