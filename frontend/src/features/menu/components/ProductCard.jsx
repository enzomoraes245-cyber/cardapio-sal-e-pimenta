import { formatPrice } from '../../../utils/format-currency.js';
import { HeartIcon } from './icons.jsx';

/**
 * Produto na listagem (RF-025): foto, nome, descrição curta e preço, com favoritar.
 * Com `onSelect`, a foto e o texto abrem os detalhes (MOD-07). Não há pedido pelo cardápio
 * (DEC-008): o antigo botão "+" de adicionar foi removido.
 */
export function ProductCard({ product, onSelect, isFavorite = false, onToggleFavorite }) {
  const content = (
    <>
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        className="size-[104px] shrink-0 rounded-[14px] bg-surface-muted object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg leading-tight font-semibold text-ink">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="line-clamp-2 text-[13px] leading-snug text-ink-muted">
              {product.shortDescription}
            </p>
          )}
        </div>
        <p className="mt-2 font-display text-lg font-bold text-ink">{formatPrice(product.price)}</p>
      </div>
    </>
  );

  const bodyClass = 'flex min-w-0 flex-1 gap-3.5 text-left';

  return (
    <article className="flex w-full gap-2 rounded-[20px] border border-line bg-white p-2.5 shadow-[0_6px_20px_rgba(17,17,17,0.06)]">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(product.id)}
          aria-haspopup="dialog"
          aria-label={`Ver detalhes de ${product.name}`}
          className={`${bodyClass} rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
        >
          {content}
        </button>
      ) : (
        <div className={bodyClass}>{content}</div>
      )}

      {onToggleFavorite && (
        <div className="flex shrink-0 flex-col items-end justify-between">
          <button
            type="button"
            onClick={() => onToggleFavorite(product.id)}
            aria-label={`Favoritar ${product.name}`}
            aria-pressed={isFavorite}
            className={`flex size-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ink ${
              isFavorite ? 'text-brand-text' : 'text-ink'
            }`}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        </div>
      )}
    </article>
  );
}
