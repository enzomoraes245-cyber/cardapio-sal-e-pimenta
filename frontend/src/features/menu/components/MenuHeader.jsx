import { useEffect, useRef, useState } from 'react';
import { HeartIcon, MenuIcon } from './icons.jsx';

/** Separa a última palavra do nome para destacá-la com a cor do restaurante. */
function splitName(name) {
  const trimmed = name.trim();
  const index = trimmed.lastIndexOf(' ');
  const start = index === -1 ? '' : trimmed.slice(0, index + 1);
  const last = index === -1 ? trimmed : trimmed.slice(index + 1);
  // Ponto final decorativo, como na identidade do cardápio ("Sal e Pimenta.").
  return { start, last: /[.!?]$/.test(last) ? last : `${last}.` };
}

const iconButton =
  'flex size-11 shrink-0 items-center text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * Cabeçalho: menu de categorias à esquerda, nome (e logotipo) ao centro e atalho para os
 * favoritos à direita. Sem `categories`/`onToggleFavorites` (ex.: prévia da personalização),
 * os botões aparecem apenas como ilustração.
 */
export function MenuHeader({
  restaurant,
  categories = [],
  onSelectCategory,
  showingFavorites = false,
  onToggleFavorites,
}) {
  const { start, last } = splitName(restaurant.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu ao clicar fora ou com Esc.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointer(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-2">
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`${iconButton} justify-start`}
        >
          <MenuIcon />
        </button>
        {menuOpen && categories.length > 0 && (
          <ul className="absolute top-12 left-0 z-30 w-60 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-[0_12px_32px_rgba(17,17,17,0.12)]">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(category.id);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[15px] text-ink hover:bg-surface-muted"
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
        {restaurant.logoUrl && (
          <img
            src={restaurant.logoUrl}
            alt={`Logotipo de ${restaurant.name}`}
            className="mb-1.5 size-12 rounded-full border border-line bg-white object-cover"
          />
        )}
        <p className="text-[11px] font-medium tracking-[2.4px] text-ink-muted uppercase">
          Cardápio
        </p>
        <h1 className="font-display text-[26px] leading-tight font-bold tracking-[-0.2px] text-ink">
          {start}
          <span className="text-brand-text">{last}</span>
        </h1>
      </div>

      <button
        type="button"
        aria-label="Ver favoritos"
        aria-pressed={showingFavorites}
        onClick={onToggleFavorites}
        className={`${iconButton} justify-end ${showingFavorites ? 'text-brand-text' : ''}`}
      >
        <HeartIcon size={22} filled={showingFavorites} />
      </button>
    </header>
  );
}
