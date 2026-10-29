import { formatPrice } from '../../../utils/format-currency.js';

/**
 * Produto na listagem (RF-025): foto, nome, descrição curta e preço.
 * Com `onSelect`, o card vira um botão que abre os detalhes (MOD-07).
 */
export function ProductCard({ product, onSelect }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-stone-900">{product.name}</h3>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{product.shortDescription}</p>
        )}
        <p className="mt-2 font-semibold text-brand-text">{formatPrice(product.price)}</p>
      </div>
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        className="size-20 shrink-0 rounded-lg bg-stone-100 object-cover"
      />
    </>
  );

  const cardClass = 'flex w-full gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm';

  if (!onSelect) return <article className={cardClass}>{content}</article>;

  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      aria-haspopup="dialog"
      aria-label={`Ver detalhes de ${product.name}`}
      className={`${cardClass} text-left transition-colors hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
    >
      {content}
    </button>
  );
}
