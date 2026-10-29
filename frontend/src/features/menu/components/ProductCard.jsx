import { formatPrice } from '../../../utils/format-currency.js';

export function ProductCard({ product }) {
  return (
    <article className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-stone-900">{product.name}</h3>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{product.shortDescription}</p>
        )}
        <p className="mt-2 font-semibold text-brand">{formatPrice(product.price)}</p>
      </div>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-20 shrink-0 rounded-lg object-cover"
        />
      )}
    </article>
  );
}
