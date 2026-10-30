import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Badge } from '../src/components/admin/Badge.jsx';
import { ConfirmDialog } from '../src/components/admin/Dialog.jsx';
import { TabPanel, Tabs } from '../src/components/admin/Tabs.jsx';
import { ToastProvider, useToast } from '../src/components/admin/Toast.jsx';
import { useSubmit } from '../src/hooks/useSubmit.js';

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

afterEach(cleanup);

describe('ConfirmDialog', () => {
  function renderDialog(onConfirm, onClose = vi.fn()) {
    render(
      <ConfirmDialog
        title="Suspender restaurante?"
        confirmLabel="Suspender"
        reason={{ label: 'Motivo', required: true, requiredMessage: 'Informe o motivo.' }}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    return { onClose };
  }

  it('exige o motivo antes de confirmar', () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Suspender' }));

    expect(screen.getByText('Informe o motivo.')).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('mantém o motivo digitado quando a ação falha e mostra o erro', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Restaurante já está suspenso.'));
    const { onClose } = renderDialog(onConfirm);
    const reason = screen.getByLabelText(/^Motivo/);

    fireEvent.change(reason, { target: { value: 'Mensalidades em atraso' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suspender' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Restaurante já está suspenso.');
    expect(reason.value).toBe('Mensalidades em atraso');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha depois de confirmar com sucesso, enviando o motivo sem espaços', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { onClose } = renderDialog(onConfirm);

    fireEvent.change(screen.getByLabelText(/^Motivo/), { target: { value: '  Atraso  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suspender' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledWith('Atraso');
  });
});

describe('Tabs', () => {
  function Harness() {
    const [value, setValue] = useState('a');
    const tabs = [
      { id: 'a', label: 'Resumo' },
      { id: 'b', label: 'Financeiro' },
      { id: 'c', label: 'Histórico' },
    ];
    return (
      <>
        <Tabs label="Seções" idPrefix="t" tabs={tabs} value={value} onChange={setValue} />
        <TabPanel idPrefix="t" tabId={value}>
          Conteúdo {value}
        </TabPanel>
      </>
    );
  }

  it('navega pelas abas com as setas e Home/End', () => {
    render(<Harness />);
    const first = screen.getByRole('tab', { name: 'Resumo' });
    expect(first.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Financeiro' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Financeiro' }));

    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(screen.getByRole('tabpanel').textContent).toBe('Conteúdo c');

    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Resumo' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('Badge', () => {
  it('sempre traz o texto da situação (não depende só da cor)', () => {
    render(<Badge tone="danger">Suspenso</Badge>);
    expect(screen.getByText('Suspenso')).toBeTruthy();
  });
});

describe('useSubmit', () => {
  it('ignora um segundo envio enquanto o primeiro está em andamento', async () => {
    let resolveAction;
    const action = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    let api;
    function Harness() {
      api = useSubmit();
      return null;
    }
    render(<Harness />);

    let first;
    let second;
    await act(async () => {
      first = api.run(action);
      second = api.run(action);
    });
    await act(async () => resolveAction());

    expect(await first).toBe(true);
    expect(await second).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe('Toast', () => {
  it('anuncia a confirmação numa região viva', async () => {
    function Harness() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.success('Produto salvo.')}>
          Salvar
        </button>
      );
    }
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const message = await screen.findByText('Produto salvo.');
    expect(message.closest('[aria-live="polite"]')).toBeTruthy();
  });
});
