import { useEffect, useId, useRef, useState } from 'react';
import { formatPrice } from '../../../utils/format-currency.js';
import { BackIcon, HeartIcon, MinusIcon, PlusIcon } from './icons.jsx';

const floatingButton =
  'flex size-11 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * Detalhes do produto sobre o cardápio (MOD-07), com <dialog> nativo:
 * foco preso no modal, Esc e clique no fundo fecham, e o foco volta ao card de origem.
 * Não há troca de rota, então busca, categoria e rolagem da listagem são preservadas (CA-024).
 * Deve ser montado com `key={product.id}`: abre ao montar e fecha ao desmontar.
 * No celular ocupa a tela inteira; em telas maiores vira um painel centralizado.
 */
export function ProductDetailsModal({
  product,
  categoryName,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onAdd,
}) {
  const dialogRef = useRef(null);
  const titleId = `produto-${product.id}-titulo`;
  const notesId = useId();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

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

  function handleAdd() {
    onAdd?.({ product, quantity, notes: notes.trim() });
    onClose();
  }

  const description = product.detailedDescription ?? product.shortDescription;
  const total = formatPrice(Number(product.price) * quantity);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-white p-0 font-menu text-ink backdrop:bg-black/60 sm:m-auto sm:h-[844px] sm:max-h-[92dvh] sm:max-w-[430px] sm:rounded-[28px] sm:shadow-xl"
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="relative h-[380px] shrink-0 bg-surface-muted">
          <img src={product.imageUrl} alt={product.name} className="block size-full object-cover" />
          <div className="absolute top-5 right-5 left-5 flex justify-between">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar ao cardápio"
              className={`${floatingButton} text-ink`}
            >
              <BackIcon />
            </button>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                aria-label="Favoritar"
                aria-pressed={isFavorite}
                className={`${floatingButton} ${isFavorite ? 'text-brand-text' : 'text-ink'}`}
              >
                <HeartIcon filled={isFavorite} />
              </button>
            )}
          </div>
        </div>

        <div className="relative -mt-7 flex flex-1 flex-col gap-5 rounded-t-[28px] bg-white px-6 pt-7 pb-6">
          <div className="flex flex-col gap-2">
            {categoryName && (
              <p className="text-[11px] font-medium tracking-[2.4px] text-ink-muted uppercase">
                {categoryName}
              </p>
            )}
            <h2 id={titleId} className="font-display text-[30px] leading-[1.15] font-bold">
              {product.name}
            </h2>
            {description && (
              <p className="text-[15px] leading-[1.55] whitespace-pre-line text-[#555555]">
                {description}
              </p>
            )}
          </div>

          <div className="h-px shrink-0 bg-line" />

          <div className="flex items-center justify-between">
            <p className="font-display text-[26px] font-bold">{formatPrice(product.price)}</p>
            <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="flex size-10 items-center justify-center rounded-full bg-white text-ink"
              >
                <MinusIcon />
              </button>
              <span aria-live="polite" className="min-w-7 text-center text-base font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
                className="flex size-10 items-center justify-center rounded-full bg-ink text-white"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>

          <label htmlFor={notesId} className="flex flex-col gap-2 text-[13px] font-semibold">
            Observações
            <textarea
              id={notesId}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: sem limão, molho à parte"
              className="resize-none rounded-[14px] border border-line-strong bg-white px-3.5 py-3 text-base font-normal text-ink focus:border-ink focus:outline-none"
            />
          </label>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleAdd}
            className="flex h-14 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-ink text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Adicionar · {total}
            <PlusIcon />
          </button>
        </div>
      </div>
    </dialog>
  );
}
