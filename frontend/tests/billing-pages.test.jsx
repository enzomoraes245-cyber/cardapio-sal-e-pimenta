import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../src/components/admin/Toast.jsx';
import { InvoicesPage } from '../src/features/platform/billing/pages/InvoicesPage.jsx';
import { PaymentsPage } from '../src/features/platform/billing/pages/PaymentsPage.jsx';
import * as billingService from '../src/features/platform/billing/services/billing.service.js';
import { resolvePeriod } from '../src/features/platform/billing/utils/period.js';
import { OverviewPage } from '../src/features/platform/overview/pages/OverviewPage.jsx';
import {
  currentIsoMonth,
  daysBetween,
  monthBounds,
  shiftIsoMonth,
  todayIsoDate,
} from '../src/utils/format-date.js';

vi.mock('../src/features/platform/billing/services/billing.service.js', () => ({
  listInvoices: vi.fn(),
  generateInvoices: vi.fn(),
  recordPayment: vi.fn(),
  voidPayment: vi.fn(),
  cancelInvoice: vi.fn(),
  reopenInvoice: vi.fn(),
  listPayments: vi.fn(),
  getOverview: vi.fn(),
}));

vi.mock('../src/features/platform/restaurants/services/platform-restaurants.service.js', () => ({
  listRestaurants: vi.fn().mockResolvedValue([
    { id: 'r1', name: 'Cantina São João' },
    { id: 'r2', name: 'Café Aroma' },
  ]),
}));

vi.mock('../src/features/platform/audit/services/audit.service.js', () => ({
  listAuditEvents: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 6 }),
}));

// jsdom pode não implementar showModal/close: simula o essencial do <dialog>.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  proto.showModal ??= function showModal() {
    this.setAttribute('open', '');
  };
  proto.close ??= function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CANTINA = { id: 'r1', name: 'Cantina São João', slug: 'cantina', status: 'ACTIVE' };
const AROMA = { id: 'r2', name: 'Café Aroma', slug: 'cafe-aroma', status: 'ACTIVE' };

const PAYMENT = {
  id: 'p1',
  amount: '80.00',
  paidOn: '2025-03-18',
  method: 'PIX',
  notes: null,
  recordedBy: { name: 'Operador' },
  recordedAt: '2025-03-18T12:00:00.000Z',
  voided: false,
  voidedAt: null,
  voidedBy: null,
  voidReason: null,
};

const INVOICES = {
  items: [
    {
      id: 'i1',
      restaurant: CANTINA,
      referenceMonth: '2025-03',
      amount: '120.00',
      dueDate: '2025-03-10',
      status: 'OPEN',
      situation: 'overdue',
      overdue: true,
      payment: null,
      canceledAt: null,
      canceledBy: null,
      cancelReason: null,
    },
    {
      id: 'i2',
      restaurant: AROMA,
      referenceMonth: '2025-03',
      amount: '80.00',
      dueDate: '2025-03-20',
      status: 'PAID',
      situation: 'paid',
      overdue: false,
      payment: PAYMENT,
      canceledAt: null,
      canceledBy: null,
      cancelReason: null,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 25,
  sum: '200.00',
};

function renderPage(element, path = '/') {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </ToastProvider>,
  );
}

const lastCall = (mock) => mock.mock.calls.at(-1);

describe('utilitários de período e datas', () => {
  const now = new Date(2026, 0, 15);

  it('resolve os períodos pela data local', () => {
    expect(resolvePeriod({ preset: 'este-mes' }, now)).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(resolvePeriod({ preset: 'mes-anterior' }, now)).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
    expect(resolvePeriod({ preset: 'todos' }, now)).toEqual({ from: undefined, to: undefined });
    expect(
      resolvePeriod({ preset: 'personalizado', from: '2026-01-10', to: '2026-01-05' }, now),
    ).toMatchObject({ invalid: true, from: '2026-01-01' });
  });

  it('calcula limites de mês e dias entre datas', () => {
    expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(shiftIsoMonth('2026-01', -1)).toBe('2025-12');
    expect(daysBetween('2025-03-10', '2025-04-09')).toBe(30);
  });
});

describe('InvoicesPage', () => {
  beforeEach(() => {
    billingService.listInvoices.mockResolvedValue(INVOICES);
  });

  it('abre em "Em aberto", mostra total e soma e muda o filtro pela situação', async () => {
    renderPage(<InvoicesPage />);

    expect(await screen.findByText(/2 mensalidades · soma/)).toBeTruthy();
    expect(screen.getByText('R$ 200,00')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Em aberto' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(lastCall(billingService.listInvoices)[0]).toMatchObject({
      situation: 'open',
      page: 1,
      pageSize: 25,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Vencidas' }));
    await waitFor(() =>
      expect(lastCall(billingService.listInvoices)[0]).toMatchObject({ situation: 'overdue' }),
    );
    expect(screen.getByText('Em aberto com vencimento anterior a hoje.')).toBeTruthy();
  });

  it('cada ação tem nome acessível com a competência e o restaurante', async () => {
    renderPage(<InvoicesPage />);

    expect(
      await screen.findByRole('button', {
        name: 'Registrar pagamento de mar. de 2025 · Cantina São João',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Estornar pagamento de mar. de 2025 · Café Aroma' }),
    ).toBeTruthy();
    expect(screen.getByText(/Pago em 18\/03\/2025 · Pix/)).toBeTruthy();
  });

  it('registra pagamento validando a forma e reaproveita a chave ao tentar de novo', async () => {
    const conflict = Object.assign(new Error('Falha de conexão.'), { status: 0 });
    billingService.recordPayment.mockRejectedValueOnce(conflict).mockResolvedValueOnce({});
    renderPage(<InvoicesPage />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Registrar pagamento de mar. de 2025 · Cantina São João',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Registrar pagamento' });
    expect(within(dialog).getByText('R$ 120,00')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }));
    expect(await within(dialog).findByText('Informe a forma de pagamento.')).toBeTruthy();
    expect(billingService.recordPayment).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Forma de pagamento/), {
      target: { value: 'PIX' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }));
    expect(await within(dialog).findByText('Falha de conexão.')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }));
    expect(await screen.findByText('Pagamento registrado.')).toBeTruthy();

    const [first, second] = billingService.recordPayment.mock.calls;
    expect(first[0]).toBe('i1');
    expect(first[1]).toEqual({ paidOn: todayIsoDate(), method: 'PIX' });
    expect(first[2].idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(second[2].idempotencyKey).toBe(first[2].idempotencyKey);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cancelamento exige motivo e mantém o texto se a API recusar', async () => {
    const refused = Object.assign(new Error('Esta mensalidade já está cancelada.'), {
      status: 409,
    });
    billingService.cancelInvoice.mockRejectedValueOnce(refused);
    renderPage(<InvoicesPage />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancelar de mar. de 2025 · Cantina São João' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar mensalidade?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar mensalidade' }));
    expect(await within(dialog).findByText('Informe o motivo do cancelamento.')).toBeTruthy();
    expect(billingService.cancelInvoice).not.toHaveBeenCalled();

    const reason = within(dialog).getByLabelText(/Motivo do cancelamento/);
    fireEvent.change(reason, { target: { value: 'Cobrança indevida' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar mensalidade' }));

    expect(await within(dialog).findByText('Esta mensalidade já está cancelada.')).toBeTruthy();
    expect(billingService.cancelInvoice).toHaveBeenCalledWith('i1', 'Cobrança indevida');
    expect(reason.value).toBe('Cobrança indevida');
    // A situação mudou por outra pessoa: a lista atrás da janela é recarregada.
    await waitFor(() => expect(billingService.listInvoices).toHaveBeenCalledTimes(2));
  });
});

describe('PaymentsPage', () => {
  const VOIDED = {
    ...PAYMENT,
    id: 'p0',
    amount: '120.00',
    paidOn: '2025-03-12',
    method: 'TRANSFER',
    recordedBy: null,
    voided: true,
    voidedAt: '2025-03-14T12:00:00.000Z',
    voidedBy: { name: 'Operador' },
    voidReason: 'Transferência devolvida',
    invoice: { id: 'i1', referenceMonth: '2025-03', dueDate: '2025-03-10' },
    restaurant: CANTINA,
  };
  const VALID = {
    ...PAYMENT,
    invoice: { id: 'i2', referenceMonth: '2025-03', dueDate: '2025-03-20' },
    restaurant: AROMA,
  };

  beforeEach(() => {
    billingService.listPayments.mockResolvedValue({
      items: [VALID, VOIDED],
      total: 2,
      page: 1,
      pageSize: 25,
      validCount: 1,
      sum: '80.00',
    });
  });

  it('soma só os válidos, mostra o estorno com motivo e só oferece estorno nos válidos', async () => {
    renderPage(<PaymentsPage />);

    expect(await screen.findByText(/1 pagamento válido/)).toBeTruthy();
    expect(screen.getByText('R$ 80,00', { selector: 'strong' })).toBeTruthy();
    expect(screen.getByText('Estornado')).toBeTruthy();
    expect(screen.getByText('Transferência devolvida')).toBeTruthy();
    expect(screen.getByText('Baixa anterior ao controle de pagamentos')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Estornar/ })).toHaveLength(1);

    const { from, to } = monthBounds(currentIsoMonth());
    expect(lastCall(billingService.listPayments)[0]).toMatchObject({ from, to });
  });

  it('estorno exige motivo e recarrega a lista', async () => {
    billingService.voidPayment.mockResolvedValue({});
    renderPage(<PaymentsPage />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Estornar pagamento de Café Aroma, mar. de 2025',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Estornar pagamento?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Estornar pagamento' }));
    expect(await within(dialog).findByText('Informe o motivo do estorno.')).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Motivo do estorno/), {
      target: { value: 'Pago em duplicidade' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Estornar pagamento' }));

    expect(await screen.findByText('Pagamento estornado.')).toBeTruthy();
    expect(billingService.voidPayment).toHaveBeenCalledWith('p1', 'Pago em duplicidade');
    await waitFor(() => expect(billingService.listPayments).toHaveBeenCalledTimes(2));
  });

  it('inclui os estornados na lista quando pedido', async () => {
    renderPage(<PaymentsPage />);
    await screen.findByText(/1 pagamento válido/);

    fireEvent.click(screen.getByLabelText('Mostrar estornados'));
    await waitFor(() =>
      expect(lastCall(billingService.listPayments)[0]).toMatchObject({ includeVoided: 'true' }),
    );
  });
});

describe('OverviewPage', () => {
  beforeEach(() => {
    billingService.getOverview.mockResolvedValue({
      today: '2026-10-30',
      period: { from: '2026-10-01', to: '2026-10-31' },
      restaurants: { total: 4, active: 3, suspended: 1 },
      upcoming: { count: 2, amount: '200.00' },
      overdue: { count: 1, amount: '120.00', restaurants: 1 },
      payments: { count: 3, amount: '360.00' },
    });
    billingService.listInvoices.mockResolvedValue({
      ...INVOICES,
      items: [INVOICES.items[0]],
      total: 1,
      pageSize: 5,
    });
  });

  it('mostra os indicadores com o critério de cada um, sem misturar aberto e recebido', async () => {
    renderPage(<OverviewPage />);

    expect(await screen.findByText('R$ 360,00')).toBeTruthy();
    expect(
      screen.getByText('Pagamentos registrados com data no período, sem os estornados.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Em aberto com vencimento hoje ou depois. Ainda não recebido.'),
    ).toBeTruthy();
    expect(screen.getByText('de 4 cadastrados · 1 suspenso')).toBeTruthy();
    expect(screen.getByText('1 mensalidade · 1 restaurante')).toBeTruthy();
    expect(await screen.findByRole('link', { name: 'Cantina São João' })).toBeTruthy();

    const { from, to } = monthBounds(currentIsoMonth());
    expect(lastCall(billingService.getOverview)[0]).toEqual({ from, to });
  });

  it('o período escolhido muda só os pagamentos consultados', async () => {
    renderPage(<OverviewPage />);
    await screen.findByText('R$ 360,00');

    fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'mes-anterior' } });

    const previous = monthBounds(shiftIsoMonth(currentIsoMonth(), -1));
    await waitFor(() => expect(lastCall(billingService.getOverview)[0]).toEqual(previous));
    expect(screen.getByRole('link', { name: /Ver pagamentos/ }).getAttribute('href')).toBe(
      '/backoffice/pagamentos?periodo=mes-anterior',
    );
  });
});
