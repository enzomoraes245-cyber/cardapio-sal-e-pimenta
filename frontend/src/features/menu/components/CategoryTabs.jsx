/**
 * Filtro de categorias com rolagem horizontal.
 * `selectedId === null` representa "Todas".
 */
export function CategoryTabs({ categories, selectedId, onSelect }) {
  return (
    <nav
      aria-label="Categorias"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-2 pb-1">
        <li>
          <CategoryButton selected={selectedId === null} onClick={() => onSelect(null)}>
            Todas
          </CategoryButton>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryButton
              selected={selectedId === category.id}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
            </CategoryButton>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        selected
          ? 'border-brand bg-brand text-brand-contrast'
          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
      }`}
    >
      {children}
    </button>
  );
}
