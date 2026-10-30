import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { LinkButton } from '../../../../components/admin/Button.jsx';
import {
  AlertTriangleIcon,
  BanknoteIcon,
  CalendarIcon,
  StoreIcon,
} from '../../../../components/admin/icons.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { Stat } from '../../../../components/admin/Stat.jsx';
import { ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import {
  daysBetween,
  formatDate,
  formatMonth,
  todayIsoDate,
} from '../../../../utils/format-date.js';
import { plural } from '../../../../utils/plural.js';
import { HistoryTimeline } from '../../audit/components/HistoryTimeline.jsx';
import { PeriodFilter } from '../../billing/components/PeriodFilter.jsx';
import { getOverview, listInvoices } from '../../billing/services/billing.service.js';
import { resolvePeriod } from '../../billing/utils/period.js';

const loadOverdue = ({ signal }) => listInvoices({ situation: 'overdue', pageSize: 5 }, { signal });

/** Parâmetros do período para a URL (os mesmos da página de pagamentos). */
function periodParams({ preset, from, to }) {
  const params = new URLSearchParams();
  if (preset !== 'este-mes') params.set('periodo', preset);
  if (preset === 'personalizado') {
    if (from) params.set('de', from);
    if (to) params.set('ate', to);
  }
  return params;
}

function OverdueList({ resource }) {
  const { status, data, error, reload } = resource;
  if (status === 'loading') return <LoadingState label="Carregando vencidas..." rows={2} />;
  if (status === 'error') {
    return <ErrorState title="Não foi possível carregar" error={error} onRetry={reload} />;
  }
  if (data.items.length === 0) {
    return <Alert tone="success">Nenhuma mensalidade vencida.</Alert>;
  }
  const today = todayIsoDate();
  return (
    <ul className="-mx-5 -my-5 divide-y divide-admin-line sm:-mx-6">
      {data.items.map((invoice) => (
        <li
          key={invoice.id}
          className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
        >
          <div className="min-w-0">
            <Link
              to={`/backoffice/restaurantes/${invoice.restaurant.id}?aba=financeiro`}
              className="font-medium text-admin-text hover:text-admin-accent focus-visible:outline-2 focus-visible:outline-admin-accent"
            >
              {invoice.restaurant.name}
            </Link>
            <p className="text-xs text-admin-muted">
              {formatMonth(invoice.referenceMonth)} · venceu em {formatDate(invoice.dueDate)} (há{' '}
              {plural(daysBetween(invoice.dueDate, today), 'dia')})
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-admin-text tabular-nums">
            {formatPrice(invoice.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Visão geral da plataforma: restaurantes, mensalidades a vencer e vencidas (situação de hoje) e
 * pagamentos registrados no período. Cada número mostra o critério usado.
 */
export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preset = searchParams.get('periodo') ?? 'este-mes';
  const customFrom = searchParams.get('de') ?? undefined;
  const customTo = searchParams.get('ate') ?? undefined;
  const period = resolvePeriod({ preset, from: customFrom, to: customTo });

  const loader = useCallback(
    ({ signal }) => getOverview({ from: period.from, to: period.to }, { signal }),
    [period.from, period.to],
  );
  const { status, data, error, reload } = useResource(loader);
  const overdue = useResource(loadOverdue);

  const paymentsQuery = periodParams({ preset, from: customFrom, to: customTo }).toString();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plataforma"
        title="Visão geral"
        description="Restaurantes e mensalidades. Valores em aberto aparecem separados dos pagamentos recebidos."
      />

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <PeriodFilter
          preset={preset}
          from={customFrom}
          to={customTo}
          onChange={(next) => setSearchParams(periodParams(next), { replace: true })}
        />
        <p className="max-w-md text-xs leading-relaxed text-admin-faint">
          O período vale para os pagamentos recebidos. Mensalidades a vencer e vencidas mostram a
          situação de hoje.
        </p>
      </div>

      {status === 'loading' && <LoadingState label="Carregando indicadores..." rows={2} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar a visão geral"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Restaurantes ativos"
            value={data.restaurants.active}
            detail={`de ${plural(data.restaurants.total, 'cadastrado', 'cadastrados')} · ${plural(data.restaurants.suspended, 'suspenso', 'suspensos')}`}
            definition="Ativos têm painel e cardápio liberados; suspensos ficam bloqueados até a reativação."
            icon={StoreIcon}
            tone="accent"
            to="/backoffice/restaurantes"
            linkLabel="Ver restaurantes"
          />
          <Stat
            label="Recebido no período"
            value={formatPrice(data.payments.amount)}
            detail={`${plural(data.payments.count, 'pagamento', 'pagamentos')} · ${formatDate(data.period.from)} a ${formatDate(data.period.to)}`}
            definition="Pagamentos registrados com data no período, sem os estornados."
            icon={BanknoteIcon}
            tone="success"
            to={`/backoffice/pagamentos${paymentsQuery ? `?${paymentsQuery}` : ''}`}
            linkLabel="Ver pagamentos"
          />
          <Stat
            label="A vencer"
            value={formatPrice(data.upcoming.amount)}
            detail={plural(data.upcoming.count, 'mensalidade em aberto', 'mensalidades em aberto')}
            definition="Em aberto com vencimento hoje ou depois. Ainda não recebido."
            icon={CalendarIcon}
            tone="warning"
            to="/backoffice/faturas?situacao=a-vencer"
            linkLabel="Ver mensalidades"
          />
          <Stat
            label="Vencidas"
            value={formatPrice(data.overdue.amount)}
            detail={`${plural(data.overdue.count, 'mensalidade', 'mensalidades')} · ${plural(data.overdue.restaurants, 'restaurante', 'restaurantes')}`}
            definition="Em aberto com vencimento anterior a hoje."
            icon={AlertTriangleIcon}
            tone={data.overdue.count > 0 ? 'danger' : 'neutral'}
            to="/backoffice/faturas?situacao=vencidas"
            linkLabel="Ver vencidas"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <Panel
          title="Mensalidades vencidas"
          description="As mais antigas primeiro."
          actions={
            <LinkButton to="/backoffice/faturas?situacao=vencidas" size="sm">
              Ver todas
            </LinkButton>
          }
        >
          <OverdueList resource={overdue} />
        </Panel>
        <Panel title="Atividade recente" description="Últimas ações registradas na plataforma.">
          <HistoryTimeline pageSize={6} paginate={false} />
        </Panel>
      </div>
    </div>
  );
}
