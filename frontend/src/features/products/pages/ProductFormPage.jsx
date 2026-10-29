import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { updateProductStatus } from '../../availability/services/availability.service.js';
import { listCategories } from '../../categories/services/categories.service.js';
import { ProductForm } from '../components/ProductForm.jsx';
import * as productsService from '../services/products.service.js';

/** Cadastro (/admin/produtos/novo) e edição (/admin/produtos/:id) de produto. */
export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const loader = useCallback(
    async ({ signal }) => {
      const [categories, product] = await Promise.all([
        listCategories({ signal }),
        isEdit ? productsService.getProduct(id, { signal }) : null,
      ]);
      return { categories, product };
    },
    [id, isEdit],
  );
  const { status, data, error, reload } = useResource(loader);

  async function handleSubmit({ image, isActive, isAvailable, ...fields }) {
    if (isEdit) {
      const current = data.product;
      await productsService.updateProduct(id, fields);
      if (image) await productsService.replaceProductImage(id, image);
      if (isActive !== current.isActive || isAvailable !== current.isAvailable) {
        await updateProductStatus(id, { isActive, isAvailable });
      }
    } else {
      await productsService.createProduct({ ...fields, isActive, isAvailable, image });
    }
    navigate('/admin/produtos');
  }

  const title = isEdit ? 'Editar produto' : 'Novo produto';

  return (
    <section className="space-y-6">
      <div>
        <Link to="/admin/produtos" className="text-sm text-slate-600 hover:underline">
          ← Produtos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      </div>

      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title={error.status === 404 ? 'Produto não encontrado' : 'Não foi possível carregar'}
          description={error.message}
          action={error.status === 404 ? undefined : { label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && data.categories.length === 0 && (
        <StatusMessage
          title="Cadastre uma categoria primeiro"
          description="Todo produto precisa pertencer a uma categoria."
          action={{ label: 'Ir para categorias', onClick: () => navigate('/admin/categorias') }}
        />
      )}
      {status === 'success' && data.categories.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <ProductForm
            key={data.product?.id ?? 'novo'}
            product={data.product}
            categories={data.categories}
            submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </section>
  );
}
