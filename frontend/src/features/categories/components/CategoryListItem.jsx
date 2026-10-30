import { useState } from 'react';
import { Button } from '../../../components/admin/Button.jsx';
import { ReorderButtons } from '../../../components/admin/ReorderButtons.jsx';
import { CategoryNameForm } from './CategoryNameForm.jsx';

export function CategoryListItem({ category, isFirst, isLast, reordering, onRename, onMove }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-slate-300 bg-white p-3">
        <CategoryNameForm
          initialName={category.name}
          submitLabel="Salvar"
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await onRename(category.id, data);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{category.name}</p>
        <p className="text-sm text-slate-500">
          {category.productCount === 1 ? '1 produto' : `${category.productCount} produtos`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          Renomear
        </Button>
        <ReorderButtons
          label={category.name}
          isFirst={isFirst}
          isLast={isLast}
          disabled={reordering}
          onMove={onMove}
        />
      </div>
    </li>
  );
}
