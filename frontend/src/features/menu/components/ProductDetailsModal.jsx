import { useEffect, useRef } from 'react';
import { formatPrice } from '../../../utils/format-currency.js';

/**
 * Detalhes do produto sobre o cardápio (MOD-07), com <dialog> nativo:
 * foco preso no modal, Esc e clique no fundo fecham, e o foco volta ao card de origem.
 * Não há troca de rota, então busca, categoria e rolagem da listagem são preservadas (CA-024).
 * Deve ser montado com `key={product.id}`: abre ao montar e fecha ao desmontar.
 */
export function ProductDetailsModal({ product, onClose }) {
  const dialogRef = useRef(null);
  const titleId = `produto-${product.id}-titulo`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  // O clique no fundo (backdrop) chega com o próprio <dialog> como alvo.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose();
  }

  const description = product.detailedDescription ?? product.shortDescription;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
      className="m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/60"
    >
      <div className="max-h-[85dvh] overflow-y-auto">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[4/3] w-full bg-stone-100 object-cover"
        />
        <div className="space-y-3 p-5">
          <h2 id={titleId} className="text-xl font-semibold text-stone-900">
            {product.name}
          </h2>
          {description && <p className="whitespace-pre-line text-stone-700">{description}</p>}
          <p className="text-lg font-semibold text-brand-text">{formatPrice(product.price)}</p>
        </div>
      </div>
      <div className="border-t border-stone-200 p-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-brand py-2.5 font-medium text-brand-contrast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          Fechar
        </button>
      </div>
    </dialog>
  );
}
