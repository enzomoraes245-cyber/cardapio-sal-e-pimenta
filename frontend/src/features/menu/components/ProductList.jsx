import { ProductCard } from './ProductCard.jsx';

export function ProductList({ categories }) {
  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`category-${category.id}`}>
          <h2
            id={`category-${category.id}`}
            className="mb-3 text-lg font-semibold text-brand-soft-contrast"
          >
            {category.name}
          </h2>
          <ul className="space-y-3">
            {category.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
