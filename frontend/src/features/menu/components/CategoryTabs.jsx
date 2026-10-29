/**
 * Filtro de categorias com rolagem horizontal: uma categoria por vez.
 * `selectedId === null` deixa todas desmarcadas (ex.: vendo favoritos ou buscando).
 */
export function CategoryTabs({ categories, selectedId, onSelect }) {
  return (
    <nav
      aria-label="Categorias"
      className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-2">
        {categories.map((category) => {
          const selected = selectedId === category.id;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(category.id)}
                className={`h-10 rounded-full border px-[18px] text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selected
                    ? 'border-ink bg-ink text-white'
                    : 'border-line-strong bg-white text-ink hover:border-ink-muted'
                }`}
              >
                {category.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
