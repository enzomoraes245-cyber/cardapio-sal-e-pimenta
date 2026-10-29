import { ProductCard } from './ProductCard.jsx';

function countLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'itens'}`;
}

/**
 * Listagem por seção (categoria, favoritos ou resultado da busca).
 * `onSelectProduct` (opcional) habilita a abertura dos detalhes; `onToggleFavorite` o coração.
 */
export function ProductList({ categories, onSelectProduct, favorites, onToggleFavorite }) {
  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`category-${category.id}`}>
          <div className="mb-3.5 flex items-baseline justify-between gap-3">
            <h2
              id={`category-${category.id}`}
              className="font-display text-2xl font-semibold text-ink"
            >
              {category.name}
            </h2>
            <span className="shrink-0 text-[13px] text-ink-muted">
              {countLabel(category.products.length)}
            </span>
          </div>
          <ul className="space-y-3.5">
            {category.products.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  onSelect={onSelectProduct}
                  isFavorite={favorites?.has(product.id) ?? false}
                  onToggleFavorite={onToggleFavorite}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
