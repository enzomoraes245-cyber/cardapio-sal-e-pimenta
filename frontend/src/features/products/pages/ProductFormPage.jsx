import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LinkButton } from '../../../components/admin/Button.jsx';
import { LayersIcon } from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { createRequestId } from '../../../utils/request-id.js';
import { updateProductStatus } from '../../availability/services/availability.service.js';
import { listCategories } from '../../categories/services/categories.service.js';
import { ProductForm } from '../components/ProductForm.jsx';
import * as productsService from '../services/products.service.js';

/** Cadastro (/admin/produtos/novo) e edição (/admin/produtos/:id) de produto. */
export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  // Uma chave por formulário: clique duplo ou nova tentativa não duplicam o cadastro.
  const [requestId] = useState(createRequestId);

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

  async function handleSubmit({ image, removeImage, isActive, isAvailable, ...fields }) {
    if (isEdit) {
      const current = data.product;
      await productsService.updateProduct(id, fields);
      if (image) await productsService.replaceProductImage(id, image);
      else if (removeImage) await productsService.removeProductImage(id);
      if (isActive !== current.isActive || isAvailable !== current.isAvailable) {
        await updateProductStatus(id, { isActive, isAvailable });
      }
      toast.success('Produto atualizado.');
    } else {
      await productsService.createProduct(
        { ...fields, isActive, isAvailable, image },
        { idempotencyKey: requestId },
      );
      toast.success('Produto cadastrado.');
    }
    navigate('/admin/produtos');
  }

  const back = { to: '/admin/produtos', label: 'Produtos' };

  return (
    <div className="space-y-8">
      <PageHeader
        back={back}
        title={isEdit ? 'Editar produto' : 'Novo produto'}
        description={
          isEdit
            ? 'As alterações aparecem no cardápio assim que você salvar.'
            : 'Nome, preço e categoria são obrigatórios; a foto pode ser enviada depois.'
        }
      />

      {status === 'loading' && <LoadingState label="Carregando produto..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title={error.status === 404 ? 'Produto não encontrado' : 'Não foi possível carregar'}
          error={error}
          onRetry={error.status === 404 ? undefined : reload}
        />
      )}
      {status === 'success' && data.categories.length === 0 && (
        <EmptyState
          icon={LayersIcon}
          title="Cadastre uma categoria primeiro"
          description="Todo produto pertence a uma categoria do cardápio."
          action={
            <LinkButton to="/admin/categorias" variant="primary">
              Ir para categorias
            </LinkButton>
          }
        />
      )}
      {status === 'success' && data.categories.length > 0 && (
        <ProductForm
          key={data.product?.id ?? 'novo'}
          product={data.product}
          categories={data.categories}
          submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
