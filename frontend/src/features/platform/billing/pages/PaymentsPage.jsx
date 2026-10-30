import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Badge } from '../../../../components/admin/Badge.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { DataTable } from '../../../../components/admin/DataTable.jsx';
import { Checkbox, Field, Select } from '../../../../components/admin/Field.jsx';
import { BanknoteIcon, UndoIcon } from '../../../../components/admin/icons.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { Pagination } from '../../../../components/admin/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatDateTime, formatMonth } from '../../../../utils/format-date.js';
import { plural } from '../../../../utils/plural.js';
import { listRestaurants } from '../../restaurants/services/platform-restaurants.service.js';
import { PeriodFilter } from '../components/PeriodFilter.jsx';
import { useInvoiceActions } from '../hooks/useInvoiceActions.jsx';
import { listPayments } from '../services/billing.service.js';
import { paymentMethodLabel } from '../utils/billing-labels.js';
import { resolvePeriod } from '../utils/period.js';

const PAGE_SIZE = 25;

function paymentColumns(onVoid) {
  return [
    {
      key: 'restaurant',
      header: 'Restaurante',
      primary: true,
      cell: (payment) => (
        <div className="min-w-0">
          <Link
            to={`/backoffice/restaurantes/${payment.restaurant.id}?aba=financeiro`}
            className="font-medium text-admin-text hover:text-admin-accent focus-visible:outline-2 focus-visible:outline-admin-accent"
          >
            {payment.restaurant.name}
          </Link>
          <p className="text-xs text-admin-faint">
            Competência {formatMonth(payment.invoice.referenceMonth)}
          </p>
        </div>
      ),
    },
    {
      key: 'paidOn',
      header: 'Data do pagamento',
      cell: (payment) => <span className="tabular-nums">{formatDate(payment.paidOn)}</span>,
    },
    {
      key: 'method',
      header: 'Forma',
      cell: (payment) => paymentMethodLabel(payment.method),
    },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      cell: (payment) => (
        <span className={payment.voided ? 'text-admin-faint line-through' : undefined}>
          {formatPrice(payment.amount)}
        </span>
      ),
    },
    {
      key: 'recorded',
      header: 'Registro',
      cell: (payment) => (
        <div className="text-xs max-md:text-right">
          <p className="text-admin-text">
            {payment.recordedBy?.name ?? 'Baixa anterior ao controle de pagamentos'}
          </p>
          <p className="text-admin-faint">{formatDateTime(payment.recordedAt)}</p>
        </div>
      ),
    },
    {
      key: 'situation',
      header: 'Situação',
      cell: (payment) =>
        payment.voided ? (
          <div className="space-y-1 max-md:text-right">
            <Badge tone="danger">Estornado</Badge>
            <p className="max-w-56 truncate text-xs text-admin-muted" title={payment.voidReason}>
              {payment.voidReason}
            </p>
            <p className="text-xs text-admin-faint">
              {payment.voidedBy?.name ?? 'Autor não identificado'} ·{' '}
              {formatDateTime(payment.voidedAt)}
            </p>
          </div>
        ) : (
          <Badge tone="success">Válido</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      cell: (payment) =>
        payment.voided ? (
          <span className="text-xs text-admin-faint">—</span>
        ) : (
          <Button variant="danger-ghost" size="sm" icon={UndoIcon} onClick={() => onVoid(payment)}>
            Estornar{' '}
            <span className="sr-only">
              pagamento de {payment.restaurant.name}, {formatMonth(payment.invoice.referenceMonth)}
            </span>
          </Button>
        ),
    },
  ];
}

/** Pagamentos de mensalidades registrados pela plataforma, com período e estornos. */
export function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preset = searchParams.get('periodo') ?? 'este-mes';
  const customFrom = searchParams.get('de') ?? undefined;
  const customTo = searchParams.get('ate') ?? undefined;
  const period = resolvePeriod({ preset, from: customFrom, to: customTo });
  const restaurantId = searchParams.get('restaurante') ?? '';
  const includeVoided = searchParams.get('estornados') === '1';
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1);

  const loader = useCallback(
    ({ signal }) =>
      listPayments(
        {
          restaurantId: restaurantId || undefined,
          from: period.from,
          to: period.to,
          includeVoided: includeVoided ? 'true' : undefined,
          page,
          pageSize: PAGE_SIZE,
        },
        { signal },
      ),
    [restaurantId, period.from, period.to, includeVoided, page],
  );
  const { status, data, error, reload } = useResource(loader);
  const restaurants = useResource(listRestaurants);
  const actions = useInvoiceActions({ onChanged: reload });

  function setFilters(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('pagina' in changes)) next.delete('pagina');
    setSearchParams(next, { replace: true });
  }

  function changePeriod({ preset: nextPreset, from, to }) {
    const custom = nextPreset === 'personalizado';
    setFilters({
      periodo: nextPreset === 'este-mes' ? '' : nextPreset,
      de: custom ? from : '',
      ate: custom ? to : '',
    });
  }

  const periodText =
    period.from && period.to
      ? `de ${formatDate(period.from)} a ${formatDate(period.to)}`
      : 'em todo o período';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagamentos"
        description="Pagamentos de mensalidades registrados pela plataforma. Estornados continuam no histórico, mas não contam como recebidos."
      />

      <section aria-label="Filtros" className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <PeriodFilter
          preset={preset}
          from={customFrom}
          to={customTo}
          onChange={changePeriod}
          allowAll
        />
        <Field label="Restaurante" className="w-full sm:w-64">
          <Select
            value={restaurantId}
            onChange={(event) => setFilters({ restaurante: event.target.value })}
          >
            <option value="">Todos os restaurantes</option>
            {(restaurants.data ?? []).map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          label="Mostrar estornados"
          className="sm:mt-7"
          checked={includeVoided}
          onChange={(event) => setFilters({ estornados: event.target.checked ? '1' : '' })}
        />
      </section>

      {status === 'loading' && <LoadingState label="Carregando pagamentos..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar os pagamentos"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && (
        <div className="space-y-3">
          <div role="status" className="space-y-0.5">
            <p className="text-sm text-admin-muted">
              Recebido {periodText}:{' '}
              <strong className="font-semibold text-admin-text tabular-nums">
                {formatPrice(data.sum)}
              </strong>{' '}
              · {plural(data.validCount, 'pagamento válido', 'pagamentos válidos')}
            </p>
            <p className="text-xs text-admin-faint">
              Soma dos pagamentos com data no período, sem os estornados.
            </p>
          </div>
          {data.items.length === 0 ? (
            <EmptyState
              icon={BanknoteIcon}
              title="Nenhum pagamento neste período"
              description="Os pagamentos aparecem aqui depois de registrados na página Mensalidades."
            />
          ) : (
            <>
              <DataTable
                caption="Pagamentos"
                columns={paymentColumns((payment) => actions.open('void', payment))}
                rows={data.items}
                getRowKey={(payment) => payment.id}
                rowClassName={(payment) => (payment.voided ? 'bg-admin-subtle/60' : undefined)}
              />
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onChange={(next) => setFilters({ pagina: next > 1 ? String(next) : '' })}
                label="Páginas de pagamentos"
              />
            </>
          )}
        </div>
      )}

      {actions.dialogs}
    </div>
  );
}
