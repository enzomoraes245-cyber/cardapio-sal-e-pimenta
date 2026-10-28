/** Normaliza texto para busca: sem acentos, minúsculo e sem espaços nas pontas. */
export function normalizeSearchText(value) {
  // NFD separa letra e acento; \p{M} remove as marcas combinantes (acentos).
  return (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * Aplica categoria selecionada e busca textual (nome ou descrição).
 * Categorias que ficarem sem produtos após o filtro são omitidas.
 */
export function filterMenuCategories(categories, { search = '', categoryId = null } = {}) {
  const term = normalizeSearchText(search);

  return categories
    .filter((category) => !categoryId || category.id === categoryId)
    .map((category) => ({
      ...category,
      products: term
        ? category.products.filter(
            (product) =>
              normalizeSearchText(product.name).includes(term) ||
              normalizeSearchText(product.description).includes(term),
          )
        : category.products,
    }))
    .filter((category) => category.products.length > 0);
}
