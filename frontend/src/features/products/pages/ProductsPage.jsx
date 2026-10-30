import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Badge } from '../../../components/admin/Badge.jsx';
import { Button, LinkButton } from '../../../components/admin/Button.jsx';
import { Field, Select, TextInput } from '../../../components/admin/Field.jsx';
import { LayersIcon, PackageIcon, PlusIcon, SearchIcon } from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { matchesSearch } from '../../../utils/search-text.js';
import { useProductStatus } from '../../availability/hooks/useProductStatus.js';
import { ProductListItem } from '../components/ProductListItem.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { PUBLICATION_FILTERS, publicationStatus } from '../utils/publication.js';

const newProductButton = (
  <LinkButton to="/admin/produtos/novo" variant="primary" icon={PlusIcon}>
    Novo produto
  </LinkButton>
);

/**
 * Produtos agrupados por categoria (na ordem do cardápio), com busca e filtros guardados na URL,
 * interruptores de situação e reordenação dentro da categoria (só sem filtros, quando a lista
 * mostra a categoria inteira).
 */
export function ProductsPage() {
  const { status, data, error, reload, groups, reordering, move, replaceProduct } = useProducts();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('busca') ?? '';
  const categoryFilter = searchParams.get('categoria') ?? '';
  const situationValue = searchParams.get('situacao') ?? 'todos';
  const situation =
    PUBLICATION_FILTERS.find((filter) => filter.value === situationValue) ?? PUBLICATION_FILTERS[0];

  const setFilter = (key, value, empty) =>
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (!value || value === empty) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const showError = useCallback((actionError) => toast.error(actionError.message), [toast]);
  const productStatus = useProductStatus({ onUpdated: replaceProduct, onError: showError });

  const filtering = search.trim() !== '' || categoryFilter !== '' || situation.value !== 'todos';
  const visibleGroups = useMemo(
    () =>
      groups
        .filter(({ category }) => !categoryFilter || category.id === categoryFilter)
        .map((group) => ({
          ...group,
          visible: group.products.filter(
            (product) =>
              situation.test(publicationStatus(product)) &&
              matchesSearch(search, product.name, product.shortDescription),
          ),
        }))
        .filter((group) => !filtering || group.visible.length > 0),
    [groups, categoryFilter, situation, search, filtering],
  );

  const total = data?.products.length ?? 0;
  const publishedCount = (data?.products ?? []).filter(
    (product) => publicationStatus(product).published,
  ).length;
  const shownCount = visibleGroups.reduce((sum, group) => sum + group.visible.length, 0);

  async function handleMove(category, products, index, offset) {
    const failure = await move(category.id, products, index, offset);
    if (failure) toast.error(failure.message);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Produtos"
        description="Preços, fotos, ordem e situação dos itens do cardápio. Alterações aparecem para os clientes na hora."
        actions={status === 'success' && data.categories.length > 0 && newProductButton}
      />

      {status === 'loading' && <LoadingState label="Carregando produtos..." rows={5} />}
      {status === 'error' && (
        <ErrorState title="Não foi possível carregar os produtos" error={error} onRetry={reload} />
      )}

      {status === 'success' && data.categories.length === 0 && (
        <EmptyState
          icon={LayersIcon}
          title="Cadastre uma categoria primeiro"
          description="Todo produto pertence a uma categoria do cardápio (ex.: Pratos, Bebidas)."
          action={
            <LinkButton to="/admin/categorias" variant="primary">
              Ir para categorias
            </LinkButton>
          }
        />
      )}

      {status === 'success' && data.categories.length > 0 && total === 0 && (
        <EmptyState
          icon={PackageIcon}
          title="Nenhum produto cadastrado"
          description="Cadastre o primeiro item com nome, preço, categoria e, se quiser, uma foto."
          action={newProductButton}
        />
      )}

      {status === 'success' && total > 0 && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
            <Field label="Buscar produto">
              <TextInput
                type="search"
                value={search}
                onChange={(event) => setFilter('busca', event.target.value, '')}
                placeholder="Nome ou descrição"
              />
            </Field>
            <Field label="Categoria">
              <Select
                value={categoryFilter}
                onChange={(event) => setFilter('categoria', event.target.value, '')}
              >
                <option value="">Todas</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isActive ? '' : ' (oculta)'}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Situação">
              <Select
                value={situation.value}
                onChange={(event) => setFilter('situacao', event.target.value, 'todos')}
              >
                {PUBLICATION_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-[13px] text-admin-muted">
              {filtering
                ? `${shownCount} de ${total} produto(s)`
                : `${total} produto(s) · ${publishedCount} no cardápio`}
            </p>
            {filtering && (
              <p className="text-[13px] text-admin-faint">
                Limpe os filtros para mudar a ordem dos produtos.
              </p>
            )}
          </div>

          {visibleGroups.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="Nenhum produto encontrado"
              description="Ajuste a busca ou os filtros."
              action={
                <Button variant="secondary" onClick={() => setSearchParams({}, { replace: true })}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            visibleGroups.map(({ category, products, visible }) => (
              <section
                key={category.id}
                aria-labelledby={`categoria-${category.id}`}
                className="overflow-hidden rounded-admin-panel border border-admin-line bg-admin-surface"
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-admin-line bg-admin-subtle px-5 py-3 sm:px-6">
                  <h2
                    id={`categoria-${category.id}`}
                    className="text-[15px] font-semibold text-admin-text"
                  >
                    {category.name}
                  </h2>
                  {!category.isActive && <Badge tone="neutral">Categoria oculta</Badge>}
                  <span className="text-[13px] text-admin-faint">{products.length} item(ns)</span>
                </header>
                {visible.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-admin-muted sm:px-6">
                    Nenhum produto nesta categoria.
                  </p>
                ) : (
                  <ul className="divide-y divide-admin-line">
                    {visible.map((product, index) => (
                      <ProductListItem
                        key={product.id}
                        product={product}
                        saving={productStatus.isSaving(product.id)}
                        onToggle={productStatus.toggle}
                        reorder={
                          filtering
                            ? null
                            : {
                                isFirst: index === 0,
                                isLast: index === products.length - 1,
                                disabled: reordering,
                                onMove: (offset) => handleMove(category, products, index, offset),
                              }
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
