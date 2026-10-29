import { useCallback } from 'react';
import { Link } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { ProductStatusToggles } from '../../availability/components/ProductStatusToggles.jsx';
import { useProductStatus } from '../../availability/hooks/useProductStatus.js';
import { ProductListItem } from '../components/ProductListItem.jsx';
import { useProducts } from '../hooks/useProducts.js';

export function ProductsPage() {
  const {
    status,
    error,
    reload,
    groups,
    reordering,
    actionError,
    setActionError,
    move,
    replaceProduct,
  } = useProducts();
  const handleStatusError = useCallback((err) => setActionError(err.message), [setActionError]);
  const productStatus = useProductStatus({
    onUpdated: replaceProduct,
    onError: handleStatusError,
  });
  const hasProducts = groups.some((group) => group.products.length > 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="mt-1 text-slate-600">
            A ordem dentro de cada categoria é a ordem de exibição no cardápio.
          </p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Novo produto
        </Link>
      </div>

      {status === 'loading' && <Spinner label="Carregando produtos..." />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar os produtos"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && !hasProducts && (
        <StatusMessage
          title="Nenhum produto cadastrado"
          description="Cadastre o primeiro produto com nome, preço, categoria e foto."
        />
      )}

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      )}

      {status === 'success' &&
        hasProducts &&
        groups.map(({ category, products }) => (
          <section key={category.id} aria-labelledby={`grupo-${category.id}`} className="space-y-2">
            <h2 id={`grupo-${category.id}`} className="text-lg font-semibold text-slate-900">
              {category.name}
            </h2>
            {products.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum produto nesta categoria.</p>
            ) : (
              <ol className="space-y-2">
                {products.map((product, index) => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    isFirst={index === 0}
                    isLast={index === products.length - 1}
                    reordering={reordering}
                    onMove={(offset) => move(category.id, products, index, offset)}
                    statusControls={
                      <ProductStatusToggles
                        product={product}
                        disabled={productStatus.isSaving(product.id)}
                        onChange={(field, value) => productStatus.toggle(product, field, value)}
                      />
                    }
                  />
                ))}
              </ol>
            )}
          </section>
        ))}
    </section>
  );
}
