import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../../../components/admin/Button.jsx';
import { Field, Select, TextInput } from '../../../../components/admin/Field.jsx';
import { PlusIcon, ReceiptIcon } from '../../../../components/admin/icons.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { Pagination } from '../../../../components/admin/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import { plural } from '../../../../utils/plural.js';
import { listRestaurants } from '../../restaurants/services/platform-restaurants.service.js';
import { GenerateInvoicesDialog } from '../components/GenerateInvoicesDialog.jsx';
import { InvoiceTable } from '../components/InvoiceTable.jsx';
import { useInvoiceActions } from '../hooks/useInvoiceActions.jsx';
import { listInvoices } from '../services/billing.service.js';
import { SITUATION_FILTERS } from '../utils/billing-labels.js';

const PAGE_SIZE = 25;
const DEFAULT_FILTER = 'em-aberto';
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const validMonth = (value) => (MONTH_PATTERN.test(value ?? '') ? value : undefined);

/**
 * Mensalidades de todos os restaurantes (DEC-006, item 2): geração do mês, filtros (na URL),
 * totais do filtro e as ações de cobrança manual em cada linha.
 */
export function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterValue = searchParams.get('situacao') ?? DEFAULT_FILTER;
  const filter =
    SITUATION_FILTERS.find((item) => item.value === filterValue) ?? SITUATION_FILTERS[0];
  const restaurantId = searchParams.get('restaurante') ?? '';
  const from = searchParams.get('de') ?? '';
  const to = searchParams.get('ate') ?? '';
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1);
  const [generating, setGenerating] = useState(false);
  // Intervalo invertido: avisa no campo e consulta sem o filtro de competência.
  const rangeInvalid = Boolean(validMonth(from) && validMonth(to) && from > to);

  const loader = useCallback(
    ({ signal }) =>
      listInvoices(
        {
          situation: filter.situation,
          restaurantId: restaurantId || undefined,
          from: rangeInvalid ? undefined : validMonth(from),
          to: rangeInvalid ? undefined : validMonth(to),
          page,
          pageSize: PAGE_SIZE,
        },
        { signal },
      ),
    [filter, restaurantId, from, to, rangeInvalid, page],
  );
  const { status, data, error, reload } = useResource(loader);
  const restaurants = useResource(listRestaurants);
  const actions = useInvoiceActions({ onChanged: reload });

  /** Atualiza filtros na URL e volta para a primeira página. */
  function setFilters(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('pagina' in changes)) next.delete('pagina');
    setSearchParams(next, { replace: true });
  }

  const filtering = restaurantId || from || to || filter.value !== DEFAULT_FILTER;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mensalidades"
        description="Cobrança manual, sem gateway: gere as mensalidades de cada mês e registre os pagamentos recebidos. Cancelamentos e estornos ficam no histórico."
        actions={
          <Button icon={PlusIcon} onClick={() => setGenerating(true)}>
            Gerar mensalidades
          </Button>
        }
      />

      <section aria-label="Filtros" className="space-y-4">
        <div className="space-y-2">
          <div role="group" aria-label="Situação" className="flex flex-wrap gap-1.5">
            {SITUATION_FILTERS.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={item.value === filter.value ? 'primary' : 'secondary'}
                aria-pressed={item.value === filter.value}
                onClick={() =>
                  setFilters({ situacao: item.value === DEFAULT_FILTER ? '' : item.value })
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-admin-faint">{filter.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
          <Field label="Restaurante">
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
          <Field label="Competência a partir de">
            <TextInput
              type="month"
              value={from}
              max={to || undefined}
              onChange={(event) => setFilters({ de: event.target.value })}
            />
          </Field>
          <Field
            label="Competência até"
            error={rangeInvalid ? 'Use um mês igual ou posterior ao inicial.' : undefined}
          >
            <TextInput
              type="month"
              value={to}
              min={from || undefined}
              onChange={(event) => setFilters({ ate: event.target.value })}
            />
          </Field>
        </div>
      </section>

      {status === 'loading' && <LoadingState label="Carregando mensalidades..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar as mensalidades"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && (
        <div className="space-y-3">
          <p role="status" className="text-sm text-admin-muted">
            {plural(data.total, 'mensalidade', 'mensalidades')} · soma{' '}
            <strong className="font-semibold text-admin-text tabular-nums">
              {formatPrice(data.sum)}
            </strong>
          </p>
          {data.items.length === 0 ? (
            <EmptyState
              icon={ReceiptIcon}
              title="Nenhuma mensalidade neste filtro"
              description={
                filtering
                  ? 'Ajuste os filtros ou escolha "Todas".'
                  : 'Gere as mensalidades do mês para começar a cobrança.'
              }
              action={
                filtering ? (
                  <Button
                    variant="secondary"
                    onClick={() => setSearchParams({}, { replace: true })}
                  >
                    Limpar filtros
                  </Button>
                ) : (
                  <Button icon={PlusIcon} onClick={() => setGenerating(true)}>
                    Gerar mensalidades
                  </Button>
                )
              }
            />
          ) : (
            <>
              <InvoiceTable invoices={data.items} onAction={actions.open} caption="Mensalidades" />
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onChange={(next) => setFilters({ pagina: next > 1 ? String(next) : '' })}
                label="Páginas de mensalidades"
              />
            </>
          )}
        </div>
      )}

      {actions.dialogs}
      {generating && (
        <GenerateInvoicesDialog onGenerated={reload} onClose={() => setGenerating(false)} />
      )}
    </div>
  );
}
