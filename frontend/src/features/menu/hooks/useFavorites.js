import { useCallback, useState } from 'react';

function storageKey(slug) {
  return `cardapio:${slug}:favoritos`;
}

function readFavorites(slug) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(slug)) ?? '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

/** Pratos favoritados pelo cliente, guardados só neste aparelho (por restaurante). */
export function useFavorites(slug) {
  const [favorites, setFavorites] = useState(() => readFavorites(slug));

  const toggleFavorite = useCallback(
    (productId) => {
      setFavorites((current) => {
        const next = new Set(current);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        try {
          localStorage.setItem(storageKey(slug), JSON.stringify([...next]));
        } catch {
          // Sem armazenamento (ex.: navegação privada): o favorito vale só nesta visita.
        }
        return next;
      });
    },
    [slug],
  );

  return { favorites, toggleFavorite };
}
