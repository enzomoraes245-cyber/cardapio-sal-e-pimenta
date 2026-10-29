import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../src/features/auth/hooks/useSession.js';
import { LoginPage } from '../src/features/auth/pages/LoginPage.jsx';

afterEach(cleanup);

function renderLogin(login) {
  render(
    <SessionContext value={{ status: 'anonymous', login }}>
      <MemoryRouter initialEntries={['/admin/login']}>
        <LoginPage />
      </MemoryRouter>
    </SessionContext>,
  );
}

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('LoginPage', () => {
  it('valida os campos antes de chamar a API', () => {
    const login = vi.fn();
    renderLogin(login);

    fill('E-mail', 'nao-e-email');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
    expect(screen.getByText('Informe a senha.')).toBeTruthy();
    expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBe('true');
    expect(login).not.toHaveBeenCalled();
  });

  it('exibe a mensagem de credenciais inválidas (CA-002)', async () => {
    const login = vi.fn().mockRejectedValue(new Error('E-mail ou senha inválidos.'));
    renderLogin(login);

    fill('E-mail', 'admin@demo.local');
    fill('Senha', 'errada');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('E-mail ou senha inválidos.'),
    );
    expect(login).toHaveBeenCalledWith({ email: 'admin@demo.local', password: 'errada' });
  });
});
