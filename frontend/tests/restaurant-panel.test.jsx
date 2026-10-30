import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../src/components/admin/Toast.jsx';
import { CategoriesPage } from '../src/features/categories/pages/CategoriesPage.jsx';
import * as categoriesService from '../src/features/categories/services/categories.service.js';
import { contrastWarnings } from '../src/features/customization/utils/contrast-warnings.js';
import { publicationStatus } from '../src/features/products/utils/publication.js';

vi.mock('../src/features/categories/services/categories.service.js', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  setCategoryStatus: vi.fn(),
  reorderCategories: vi.fn(),
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

describe('publicationStatus (mesma regra da API)', () => {
  const base = {
    isActive: true,
    isAvailable: true,
    imageUrl: '/uploads/foto.png',
    category: { isActive: true },
  };

  it('publica só produto ativo, disponível, com foto e em categoria visível', () => {
    expect(publicationStatus(base)).toMatchObject({ published: true, label: 'No cardápio' });
    expect(publicationStatus({ ...base, imageUrl: null }).label).toBe('Sem foto');
    expect(publicationStatus({ ...base, isAvailable: false }).label).toBe('Indisponível');
    expect(publicationStatus({ ...base, isActive: false }).label).toBe('Inativo');
    expect(publicationStatus({ ...base, category: { isActive: false } }).label).toBe(
      'Categoria oculta',
    );
  });
});

describe('contrastWarnings', () => {
  it('não avisa para fundo claro e destaque legível', () => {
    expect(contrastWarnings({ primaryColor: '#9a3412', secondaryColor: '#fafaf9' })).toEqual({});
  });

  it('avisa quando o fundo escuro prejudica a leitura dos textos do cardápio', () => {
    const warnings = contrastWarnings({ primaryColor: '#9a3412', secondaryColor: '#1f2937' });
    expect(warnings.secondaryColor).toMatch(/difíceis de ler/);
  });

  it('avisa quando o destaque some sobre o fundo', () => {
    // Destaque claro vira texto escuro (regra do cardápio), que some sobre fundo escuro.
    const warnings = contrastWarnings({ primaryColor: '#fde68a', secondaryColor: '#3b3b3b' });
    expect(warnings.primaryColor).toMatch(/pouco visível/);
  });
});

describe('CategoriesPage', () => {
  function renderPage() {
    render(
      <ToastProvider>
        <MemoryRouter>
          <CategoriesPage />
        </MemoryRouter>
      </ToastProvider>,
    );
  }

  const CATEGORIES = [
    { id: 'c1', name: 'Pratos', isActive: true, productCount: 4, publishableCount: 3 },
    { id: 'c2', name: 'Bebidas', isActive: false, productCount: 2, publishableCount: 2 },
  ];

  it('só libera o cadastro depois que a lista carrega (evita a falha ao adicionar cedo)', async () => {
    let resolveList;
    categoriesService.listCategories.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );
    renderPage();

    expect(screen.getByRole('button', { name: 'Adicionar categoria' }).disabled).toBe(true);
    resolveList(CATEGORIES);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Adicionar categoria' }).disabled).toBe(false),
    );
  });

  it('mostra contagens e pede confirmação ao ocultar categoria com produtos no cardápio', async () => {
    categoriesService.listCategories.mockResolvedValue(CATEGORIES);
    categoriesService.setCategoryStatus.mockResolvedValue({ ...CATEGORIES[0], isActive: false });
    renderPage();

    expect(await screen.findByText('4 produtos · 3 no cardápio')).toBeTruthy();
    expect(screen.getByText('Oculta')).toBeTruthy();

    fireEvent.click(screen.getByRole('switch', { name: 'Visível no cardápio: Pratos' }));
    expect(await screen.findByRole('dialog', { name: 'Ocultar "Pratos"?' })).toBeTruthy();
    expect(categoriesService.setCategoryStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar categoria' }));
    await waitFor(() =>
      expect(categoriesService.setCategoryStatus).toHaveBeenCalledWith('c1', false),
    );
  });

  it('envia a chave de idempotência ao cadastrar e troca de chave depois do sucesso', async () => {
    categoriesService.listCategories.mockResolvedValue([]);
    categoriesService.createCategory.mockImplementation(async ({ name }) => ({
      id: `id-${name}`,
      name,
      isActive: true,
      productCount: 0,
      publishableCount: 0,
    }));
    renderPage();
    await screen.findByText('Nenhuma categoria ainda');

    const input = screen.getByLabelText('Nome da categoria');
    fireEvent.change(input, { target: { value: 'Sobremesas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar categoria' }));
    await screen.findByText('Sobremesas');

    fireEvent.change(input, { target: { value: 'Bebidas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar categoria' }));
    await screen.findByText('Bebidas');

    const [first, second] = categoriesService.createCategory.mock.calls.map(
      ([, options]) => options.idempotencyKey,
    );
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(second).not.toBe(first);
  });
});
