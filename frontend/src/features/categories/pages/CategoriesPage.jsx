import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { CategoryListItem } from '../components/CategoryListItem.jsx';
import { CategoryNameForm } from '../components/CategoryNameForm.jsx';
import { useCategories } from '../hooks/useCategories.js';

export function CategoriesPage() {
  const { status, data, error, reload, reordering, actionError, create, rename, move } =
    useCategories();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="mt-1 text-slate-600">
          A ordem abaixo é a ordem de exibição no cardápio. Categorias sem produtos visíveis não
          aparecem para os clientes.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <CategoryNameForm submitLabel="Adicionar" onSubmit={create} />
      </div>

      {status === 'loading' && <Spinner label="Carregando categorias..." />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar as categorias"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && data.length === 0 && (
        <StatusMessage
          title="Nenhuma categoria cadastrada"
          description="Adicione a primeira categoria para começar a montar o cardápio."
        />
      )}

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      )}

      {status === 'success' && data.length > 0 && (
        <ol className="space-y-2" aria-label="Categorias em ordem de exibição">
          {data.map((category, index) => (
            <CategoryListItem
              key={category.id}
              category={category}
              isFirst={index === 0}
              isLast={index === data.length - 1}
              reordering={reordering}
              onRename={rename}
              onMove={(offset) => move(data, index, offset)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
