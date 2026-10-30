import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { cx } from '../../../../components/admin/cx.js';
import { ClockIcon } from '../../../../components/admin/icons.jsx';
import { Pagination } from '../../../../components/admin/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatDateTime } from '../../../../utils/format-date.js';
import { listAuditEvents } from '../services/audit.service.js';
import {
  ACTOR_LABELS,
  AUDIT_ACTION_LABELS,
  auditTone,
  describeAuditEvent,
} from '../utils/audit-labels.js';

const DOT_TONES = {
  neutral: 'bg-admin-faint',
  accent: 'bg-admin-accent',
  success: 'bg-admin-success',
  danger: 'bg-admin-danger',
};

/**
 * Histórico de ações relevantes (quem, quando, o quê e por quê), do mais recente para o mais
 * antigo. Sem `restaurantId`, mostra a atividade de toda a plataforma com o restaurante de cada
 * evento. Para recarregar depois de uma alteração na mesma tela, quem usa troca a `key`.
 */
export function HistoryTimeline({ restaurantId, pageSize = 15, paginate = true }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(
    ({ signal }) => listAuditEvents({ restaurantId, page, pageSize }, { signal }),
    [restaurantId, page, pageSize],
  );
  const { status, data, error, reload } = useResource(loader);

  if (status === 'loading') return <LoadingState label="Carregando histórico..." rows={3} />;
  if (status === 'error') {
    return (
      <ErrorState title="Não foi possível carregar o histórico" error={error} onRetry={reload} />
    );
  }
  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={ClockIcon}
        title="Nenhuma ação registrada"
        description="Alterações cadastrais, de acesso, de módulos e financeiras aparecem aqui."
      />
    );
  }

  return (
    <div>
      <ol className="space-y-0">
        {data.items.map((event, index) => {
          const details = describeAuditEvent(event);
          const last = index === data.items.length - 1;
          return (
            <li key={event.id} className="relative flex gap-4 pb-6">
              {!last && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 bottom-0 left-[5px] w-px bg-admin-line"
                />
              )}
              <span
                aria-hidden="true"
                className={cx(
                  'relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-admin-surface',
                  DOT_TONES[auditTone(event.action)],
                )}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-admin-text">
                  {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                  {!restaurantId && event.restaurant && (
                    <>
                      {' · '}
                      <Link
                        to={`/backoffice/restaurantes/${event.restaurant.id}`}
                        className="text-admin-accent hover:underline focus-visible:outline-2 focus-visible:outline-admin-accent"
                      >
                        {event.restaurant.name}
                      </Link>
                    </>
                  )}
                </p>
                {details.map((line) => (
                  <p key={line} className="text-[13px] text-admin-muted">
                    {line}
                  </p>
                ))}
                {event.reason && (
                  <p className="text-[13px] text-admin-text">
                    <span className="font-medium">Motivo:</span> {event.reason}
                  </p>
                )}
                <p className="text-xs text-admin-faint">
                  {event.actor.name ?? 'Autor não identificado'} ·{' '}
                  {ACTOR_LABELS[event.actor.type] ?? event.actor.type} ·{' '}
                  <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {paginate && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onChange={setPage}
          label="Páginas do histórico"
        />
      )}
    </div>
  );
}
