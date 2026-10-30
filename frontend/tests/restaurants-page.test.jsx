import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RestaurantsPage } from '../src/features/platform/restaurants/pages/RestaurantsPage.jsx';

vi.mock('../src/features/platform/restaurants/services/platform-restaurants.service.js', () => ({
  listRestaurants: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Cantina São João',
      slug: 'cantina',
      status: 'ACTIVE',
      contactEmail: null,
      primaryAdmin: { name: 'Ana', email: 'ana@cantina.local' },
      subscription: { monthlyAmount: '99.90', dueDay: 10 },
      overdueInvoices: 2,
      overdueAmount: '199.80',
    },
    {
      id: '2',
      name: 'Café Aroma',
      slug: 'cafe-aroma',
      status: 'SUSPENDED',
      contactEmail: 'contato@aroma.local',
      primaryAdmin: null,
      subscription: null,
      overdueInvoices: 0,
      overdueAmount: '0.00',
    },
  ]),
}));

afterEach(cleanup);

function renderPage() {
  render(
    <MemoryRouter>
      <RestaurantsPage />
    </MemoryRouter>,
  );
}

const rowNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('RestaurantsPage', () => {
  it('lista com situação e mensalidades vencidas por extenso', async () => {
    renderPage();
    expect(await screen.findByRole('table', { name: 'Restaurantes' })).toBeTruthy();
    expect(rowNames()).toEqual(['Cantina São João', 'Café Aroma']);
    expect(screen.getByText('Suspenso')).toBeTruthy();
    expect(screen.getByText(/2 · R\$\s199,80/)).toBeTruthy();
  });

  it('busca sem diferenciar acentos e filtra por situação e por vencidas', async () => {
    renderPage();
    await screen.findByRole('table');

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'sao joao' } });
    expect(rowNames()).toEqual(['Cantina São João']);

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Situação do serviço'), {
      target: { value: 'suspended' },
    });
    expect(rowNames()).toEqual(['Café Aroma']);

    fireEvent.change(screen.getByLabelText('Mensalidades'), { target: { value: 'overdue' } });
    expect(screen.getByText('Nenhum restaurante encontrado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(rowNames()).toHaveLength(2);
  });
});
