import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../src/components/admin/Toast.jsx';
import { RESTAURANT_AREA } from '../src/features/auth/areas.js';
import { SessionContext } from '../src/features/auth/hooks/useSession.js';
import { AccountPage } from '../src/features/auth/pages/AccountPage.jsx';
import { LoginPage } from '../src/features/auth/pages/LoginPage.jsx';
import { ResetPasswordPage } from '../src/features/auth/pages/ResetPasswordPage.jsx';
import { ApiError } from '../src/services/api.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

function areaWith(account) {
  return {
    ...RESTAURANT_AREA,
    account: {
      getRecoveryOptions: vi.fn().mockResolvedValue({ emailRecovery: true, linkTtlMinutes: 60 }),
      ...account,
    },
  };
}

function renderWithSession(ui, session = { status: 'anonymous', login: vi.fn() }) {
  return render(
    <SessionContext value={session}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </SessionContext>,
  );
}

// Campos obrigatórios mostram "*" (oculto para leitores de tela) logo após o rótulo.
const byLabel = (label) => screen.getByLabelText(new RegExp('^' + label + '\\*?$'));
const fill = (label, value) => fireEvent.change(byLabel(label), { target: { value } });

describe('LoginPage', () => {
  it('oferece "Esqueci minha senha" quando a recuperação por e-mail está disponível', async () => {
    renderWithSession(<LoginPage area={areaWith()} />);
    expect(await screen.findByRole('link', { name: 'Esqueci minha senha' })).toBeTruthy();
  });

  it('orienta a procurar o suporte quando a recuperação está indisponível', async () => {
    const area = areaWith({
      getRecoveryOptions: vi.fn().mockResolvedValue({ emailRecovery: false }),
    });
    renderWithSession(<LoginPage area={area} />);
    expect(await screen.findByText(/fale com o suporte da plataforma/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Esqueci minha senha' })).toBeNull();
  });

  it('identifica acesso bloqueado com título próprio', async () => {
    const error = new ApiError('O seu acesso foi bloqueado.', {
      status: 403,
      code: 'USER_DISABLED',
    });
    renderWithSession(<LoginPage area={areaWith()} />, {
      status: 'anonymous',
      login: vi.fn().mockRejectedValue(error),
    });

    fill('E-mail', 'admin@demo.local');
    fill('Senha', 'senha-qualquer');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Acesso bloqueado');
    expect(alert.textContent).toContain('O seu acesso foi bloqueado.');
  });
});

describe('ResetPasswordPage', () => {
  it('lê o token do link, retira-o do endereço e redefine a senha', async () => {
    window.history.replaceState(null, '', '/admin/redefinir-senha#token=token-de-teste-123');
    const resetPassword = vi.fn().mockResolvedValue(null);
    renderWithSession(<ResetPasswordPage area={areaWith({ resetPassword })} />);

    expect(window.location.hash).toBe('');

    fill('Nova senha', 'nova-senha-123');
    fill('Confirme a nova senha', 'outra-senha-123');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();

    fill('Confirme a nova senha', 'nova-senha-123');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    await screen.findByText(/Sua senha foi alterada/);
    expect(resetPassword).toHaveBeenCalledWith({
      token: 'token-de-teste-123',
      password: 'nova-senha-123',
    });
  });

  it('sem token, explica que o link é inválido', () => {
    window.history.replaceState(null, '', '/admin/redefinir-senha');
    renderWithSession(<ResetPasswordPage area={areaWith()} />);
    expect(screen.getByRole('heading', { name: 'Link inválido' })).toBeTruthy();
  });
});

describe('AccountPage', () => {
  const session = {
    status: 'authenticated',
    admin: { name: 'Ana', email: 'ana@demo.local' },
    restaurant: { name: 'Demo' },
  };

  it('mostra o erro da senha atual junto do campo', async () => {
    const error = new ApiError('A senha atual está incorreta.', {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ path: 'currentPassword', message: 'A senha atual está incorreta.' }],
    });
    const changePassword = vi.fn().mockRejectedValue(error);
    renderWithSession(<AccountPage area={areaWith({ changePassword })} />, session);

    fill('Senha atual', 'errada-123');
    fill('Nova senha', 'nova-senha-123');
    fill('Confirme a nova senha', 'nova-senha-123');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    await waitFor(() => expect(byLabel('Senha atual').getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getByText('A senha atual está incorreta.')).toBeTruthy();
  });

  it('troca a senha, limpa o formulário e confirma', async () => {
    const changePassword = vi.fn().mockResolvedValue(null);
    renderWithSession(<AccountPage area={areaWith({ changePassword })} />, session);

    fill('Senha atual', 'senha-atual-1');
    fill('Nova senha', 'nova-senha-123');
    fill('Confirme a nova senha', 'nova-senha-123');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    await screen.findByText(/Senha alterada/);
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'senha-atual-1',
      newPassword: 'nova-senha-123',
      confirmPassword: 'nova-senha-123',
    });
    expect(byLabel('Senha atual').value).toBe('');
  });
});
