/**
 * Situação de um produto no cardápio público, pela mesma regra da API: aparece se estiver ativo,
 * disponível, com foto e em categoria visível. O motivo é o primeiro impedimento encontrado.
 */
export function publicationStatus(product) {
  if (!product.isActive) {
    return { key: 'inactive', published: false, tone: 'neutral', label: 'Inativo' };
  }
  if (product.category?.isActive === false) {
    return { key: 'category', published: false, tone: 'neutral', label: 'Categoria oculta' };
  }
  if (!product.imageUrl) {
    return { key: 'photo', published: false, tone: 'warning', label: 'Sem foto' };
  }
  if (!product.isAvailable) {
    return { key: 'unavailable', published: false, tone: 'warning', label: 'Indisponível' };
  }
  return { key: 'published', published: true, tone: 'success', label: 'No cardápio' };
}

/** Filtros de situação da lista de produtos (valor do parâmetro ?situacao=). */
export const PUBLICATION_FILTERS = [
  { value: 'todos', label: 'Todas', test: () => true },
  { value: 'no-cardapio', label: 'No cardápio', test: (status) => status.published },
  { value: 'fora', label: 'Fora do cardápio', test: (status) => !status.published },
  { value: 'sem-foto', label: 'Sem foto', test: (status) => status.key === 'photo' },
  {
    value: 'indisponiveis',
    label: 'Indisponíveis',
    test: (status) => status.key === 'unavailable',
  },
  { value: 'inativos', label: 'Inativos', test: (status) => status.key === 'inactive' },
  {
    value: 'categoria-oculta',
    label: 'Em categoria oculta',
    test: (status) => status.key === 'category',
  },
];
