import { useState } from 'react';
import { Badge } from '../../../components/admin/Badge.jsx';
import { IconButton } from '../../../components/admin/Button.jsx';
import { Switch } from '../../../components/admin/Field.jsx';
import { PencilIcon } from '../../../components/admin/icons.jsx';
import { ReorderButtons } from '../../../components/admin/ReorderButtons.jsx';
import { CategoryNameForm } from './CategoryNameForm.jsx';

function countsLabel(category) {
  const total = `${category.productCount} produto${category.productCount === 1 ? '' : 's'}`;
  if (!category.isActive) return `${total} · nenhum no cardápio enquanto oculta`;
  return `${total} · ${category.publishableCount} no cardápio`;
}

/** Categoria na lista: nome (com renomeação), contagens, exibição no cardápio e ordem. */
export function CategoryListItem({
  category,
  position,
  isFirst,
  isLast,
  reordering,
  onRename,
  onToggle,
  onMove,
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center">
      <span
        aria-hidden="true"
        className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-admin-neutral-soft text-[13px] font-semibold text-admin-muted tabular-nums lg:flex"
      >
        {position}
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <CategoryNameForm
            label={`Novo nome para ${category.name}`}
            hideLabel
            initialName={category.name}
            submitLabel="Salvar"
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (data) => {
              await onRename(category.id, data);
              setEditing(false);
            }}
          />
        ) : (
          <div className="space-y-0.5">
            <p className="flex flex-wrap items-center gap-2 font-medium text-admin-text">
              {category.name}
              {!category.isActive && <Badge tone="neutral">Oculta</Badge>}
            </p>
            <p className="text-[13px] text-admin-muted">{countsLabel(category)}</p>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          <div className="flex items-center gap-2">
            <Switch
              label={`Visível no cardápio: ${category.name}`}
              hideLabel
              checked={category.isActive}
              onChange={(checked) => onToggle(category, checked)}
            />
            <span aria-hidden="true" className="text-[13px] font-medium text-admin-muted">
              Visível no cardápio
            </span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              label={`Renomear ${category.name}`}
              icon={PencilIcon}
              size="sm"
              onClick={() => setEditing(true)}
            />
            <ReorderButtons
              label={category.name}
              isFirst={isFirst}
              isLast={isLast}
              disabled={reordering}
              onMove={onMove}
            />
          </div>
        </div>
      )}
    </li>
  );
}
