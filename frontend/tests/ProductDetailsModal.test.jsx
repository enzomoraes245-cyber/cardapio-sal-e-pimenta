import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ProductDetailsModal } from '../src/features/menu/components/ProductDetailsModal.jsx';
import { ProductList } from '../src/features/menu/components/ProductList.jsx';

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

const CATEGORIES = [
  {
    id: 'pratos',
    name: 'Pratos',
    products: [
      {
        id: 'p1',
        name: 'Filé à parmegiana',
        shortDescription: 'Acompanha arroz.',
        detailedDescription: 'Filé empanado com molho de tomate e muçarela.',
        price: '68.00',
        imageUrl: '/uploads/file.png',
      },
      {
        id: 'p2',
        name: 'Risoto',
        shortDescription: null,
        detailedDescription: null,
        price: '58.00',
        imageUrl: '/uploads/risoto.png',
      },
    ],
  },
];

function MenuHarness() {
  const [openId, setOpenId] = useState(null);
  const product = CATEGORIES[0].products.find((p) => p.id === openId);
  return (
    <>
      <ProductList categories={CATEGORIES} onSelectProduct={setOpenId} />
      {product && (
        <ProductDetailsModal key={product.id} product={product} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

describe('modal de detalhes do produto (MOD-07)', () => {
  it('não oferece pedido: sem quantidade, observações nem botão de adicionar (DEC-008)', () => {
    render(<MenuHarness />);

    // Na listagem, só o card (detalhes) e nenhum botão "+".
    expect(screen.queryByRole('button', { name: /Adicionar/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Filé à parmegiana' }));

    const dialog = screen.getByRole('dialog', { name: 'Filé à parmegiana' });
    expect(dialog.textContent).toMatch(/R\$\s68,00/);
    expect(
      screen.queryByRole('button', { name: /Adicionar|Aumentar quantidade|Diminuir quantidade/ }),
    ).toBeNull();
    expect(screen.queryByLabelText('Observações')).toBeNull();
    expect(dialog.querySelector('textarea')).toBeNull();
  });

  it('abre sobre a listagem com os dados do produto selecionado (CA-022, CA-023)', () => {
    render(<MenuHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Filé à parmegiana' }));

    const dialog = screen.getByRole('dialog', { name: 'Filé à parmegiana' });
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('Filé empanado com molho de tomate e muçarela.');
    // Intl separa "R$" do valor com espaço não separável.
    expect(dialog.textContent).toMatch(/R\$\s68,00/);
    expect(dialog.querySelector('img').getAttribute('src')).toBe('/uploads/file.png');
    // A listagem continua montada por baixo do modal.
    expect(
      screen.getByRole('button', { name: 'Ver detalhes de Risoto', hidden: true }),
    ).toBeTruthy();
  });

  it('fecha pelo botão, Esc ou clique no fundo e devolve o foco ao card (CA-024)', () => {
    render(<MenuHarness />);
    const card = screen.getByRole('button', { name: 'Ver detalhes de Filé à parmegiana' });

    for (const close of [
      () => fireEvent.click(screen.getByRole('button', { name: 'Voltar ao cardápio' })),
      () => fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true })),
      () => fireEvent.click(screen.getByRole('dialog')),
    ]) {
      card.focus();
      fireEvent.click(card);
      expect(screen.getByRole('dialog')).toBeTruthy();

      close();

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(card);
    }
  });

  it('sem onSelectProduct, os cards não são clicáveis (módulo desligado)', () => {
    render(<ProductList categories={CATEGORIES} />);

    expect(screen.queryByRole('button', { name: /Ver detalhes|Adicionar/ })).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
