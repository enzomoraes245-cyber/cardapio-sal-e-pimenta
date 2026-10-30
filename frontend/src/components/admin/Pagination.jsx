import { Button } from './Button.jsx';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

/** Navegação entre páginas de uma listagem, com o intervalo exibido ("1–50 de 120"). */
export function Pagination({ page, pageSize, total, onChange, label = 'Paginação' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-admin-muted"
    >
      <p className="tabular-nums">
        {first}–{last} de {total}
      </p>
      {pages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronLeftIcon}
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
          >
            Próxima
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      )}
    </nav>
  );
}
