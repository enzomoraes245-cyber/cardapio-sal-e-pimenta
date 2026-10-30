import { useState } from 'react';
import { ConfirmDialog } from '../../../components/admin/Dialog.jsx';
import { LayersIcon } from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../components/admin/Panel.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { createRequestId } from '../../../utils/request-id.js';
import { CategoryListItem } from '../components/CategoryListItem.jsx';
import { CategoryNameForm } from '../components/CategoryNameForm.jsx';
import { useCategories } from '../hooks/useCategories.js';

/**
 * Categorias do cardápio: cadastro, renomeação, exibição (ocultar mantém os produtos) e ordem.
 * O cadastro só fica disponível depois que a lista carrega.
 */
export function CategoriesPage() {
  const { status, data, error, reload, reordering, create, rename, setStatus, move } =
    useCategories();
  const toast = useToast();
  const [requestId, setRequestId] = useState(createRequestId);
  const [hiding, setHiding] = useState(null);

  async function handleCreate(values) {
    const category = await create(values, { idempotencyKey: requestId });
    setRequestId(createRequestId());
    toast.success(`Categoria "${category.name}" criada.`);
  }

  async function changeStatus(category, isActive) {
    try {
      await setStatus(category.id, isActive);
      toast.success(
        isActive
          ? `"${category.name}" voltou a aparecer no cardápio.`
          : `"${category.name}" foi ocultada do cardápio.`,
      );
    } catch (statusError) {
      toast.error(statusError.message);
    }
  }

  function handleToggle(category, isActive) {
    // Ocultar uma categoria com produtos no cardápio pede confirmação.
    if (!isActive && category.publishableCount > 0) setHiding(category);
    else changeStatus(category, isActive);
  }

  async function handleMove(index, offset) {
    const failure = await move(data, index, offset);
    if (failure) toast.error(failure.message);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categorias"
        description="Seções do cardápio, na ordem em que aparecem para os clientes. Ocultar uma categoria tira ela e seus produtos do cardápio, sem apagar nada."
      />

      <Panel title="Nova categoria">
        <CategoryNameForm
          submitLabel="Adicionar categoria"
          disabled={status !== 'success'}
          onSubmit={handleCreate}
        />
      </Panel>

      {status === 'loading' && <LoadingState label="Carregando categorias..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar as categorias"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && data.length === 0 && (
        <EmptyState
          icon={LayersIcon}
          title="Nenhuma categoria ainda"
          description="Crie a primeira seção do cardápio, como Pratos, Bebidas ou Sobremesas."
        />
      )}
      {status === 'success' && data.length > 0 && (
        <Panel
          title="Ordem no cardápio"
          description={`${data.length} categoria(s) · ${data.filter((c) => c.isActive).length} visível(is)`}
          flush
        >
          <ol className="divide-y divide-admin-line">
            {data.map((category, index) => (
              <CategoryListItem
                key={category.id}
                category={category}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === data.length - 1}
                reordering={reordering}
                onRename={async (id, values) => {
                  await rename(id, values);
                  toast.success('Categoria renomeada.');
                }}
                onToggle={handleToggle}
                onMove={(offset) => handleMove(index, offset)}
              />
            ))}
          </ol>
        </Panel>
      )}

      {hiding && (
        <ConfirmDialog
          title={`Ocultar "${hiding.name}"?`}
          description={`${hiding.publishableCount} produto(s) desta categoria deixam de aparecer no cardápio. Nada é apagado: reative quando quiser.`}
          confirmLabel="Ocultar categoria"
          onClose={() => setHiding(null)}
          onConfirm={async () => {
            await setStatus(hiding.id, false);
            toast.success(`"${hiding.name}" foi ocultada do cardápio.`);
          }}
        />
      )}
    </div>
  );
}
