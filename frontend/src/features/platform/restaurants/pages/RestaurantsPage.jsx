import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../../../components/admin/Badge.jsx';
import { Button, LinkButton } from '../../../../components/admin/Button.jsx';
import { DataTable } from '../../../../components/admin/DataTable.jsx';
import { Field, Select, TextInput } from '../../../../components/admin/Field.jsx';
import { PlusIcon, SearchIcon, StoreIcon } from '../../../../components/admin/icons.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import { matchesSearch } from '../../../../utils/search-text.js';
import { RestaurantStatusBadge } from '../components/RestaurantStatusBadge.jsx';
import { listRestaurants } from '../services/platform-restaurants.service.js';

const SITUATIONS = {
  all: () => true,
  active: (restaurant) => restaurant.status === 'ACTIVE',
  suspended: (restaurant) => restaurant.status === 'SUSPENDED',
};

const FINANCES = {
  all: () => true,
  overdue: (restaurant) => restaurant.overdueInvoices > 0,
  current: (restaurant) => restaurant.overdueInvoices === 0,
};

const COLUMNS = [
  {
    key: 'name',
    header: 'Restaurante',
    primary: true,
    cell: (restaurant) => (
      <div className="min-w-0">
        <Link
          to={`/backoffice/restaurantes/${restaurant.id}`}
          className="font-medium text-admin-text hover:text-admin-accent focus-visible:outline-2 focus-visible:outline-admin-accent"
        >
          {restaurant.name}
        </Link>
        <p className="truncate text-xs text-admin-faint">/cardapio/{restaurant.slug}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Situação',
    cell: (restaurant) => <RestaurantStatusBadge status={restaurant.status} />,
  },
  {
    key: 'admin',
    header: 'Responsável',
    cell: (restaurant) =>
      restaurant.primaryAdmin ? (
        <div className="min-w-0 max-md:text-right">
          <p className="truncate">{restaurant.primaryAdmin.name}</p>
          <p className="truncate text-xs text-admin-faint">{restaurant.primaryAdmin.email}</p>
        </div>
      ) : (
        <span className="text-admin-faint">—</span>
      ),
  },
  {
    key: 'subscription',
    header: 'Assinatura',
    align: 'right',
    cell: (restaurant) =>
      restaurant.subscription ? (
        <span>
          {formatPrice(restaurant.subscription.monthlyAmount)}
          <span className="text-admin-faint"> · dia {restaurant.subscription.dueDay}</span>
        </span>
      ) : (
        <span className="text-admin-faint">Sem assinatura</span>
      ),
  },
  {
    key: 'overdue',
    header: 'Mensalidades vencidas',
    align: 'right',
    cell: (restaurant) =>
      restaurant.overdueInvoices > 0 ? (
        <Badge tone="danger">
          {restaurant.overdueInvoices} · {formatPrice(restaurant.overdueAmount)}
        </Badge>
      ) : (
        <span className="text-admin-faint">Nenhuma</span>
      ),
  },
];

/** Lista de restaurantes clientes, com busca e filtros por situação operacional e financeira. */
export function RestaurantsPage() {
  const { status, data, error, reload } = useResource(listRestaurants);
  const [search, setSearch] = useState('');
  const [situation, setSituation] = useState('all');
  const [finance, setFinance] = useState('all');

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (restaurant) =>
          SITUATIONS[situation](restaurant) &&
          FINANCES[finance](restaurant) &&
          matchesSearch(
            search,
            restaurant.name,
            restaurant.slug,
            restaurant.contactEmail,
            restaurant.primaryAdmin?.email,
            restaurant.primaryAdmin?.name,
          ),
      ),
    [data, search, situation, finance],
  );

  const filtering = search.trim() !== '' || situation !== 'all' || finance !== 'all';
  function clearFilters() {
    setSearch('');
    setSituation('all');
    setFinance('all');
  }

  const newButton = (
    <LinkButton to="/backoffice/restaurantes/novo" variant="primary" icon={PlusIcon}>
      Novo restaurante
    </LinkButton>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Restaurantes"
        description="Clientes da plataforma: situação do serviço, responsável, assinatura e mensalidades vencidas."
        actions={newButton}
      />

      {status === 'loading' && <LoadingState label="Carregando restaurantes..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar os restaurantes"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && data.length === 0 && (
        <EmptyState
          icon={StoreIcon}
          title="Nenhum restaurante cadastrado"
          description="Cadastre o primeiro restaurante para liberar o painel, o cardápio e o QR Code."
          action={newButton}
        />
      )}
      {status === 'success' && data.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
            <Field label="Buscar">
              <TextInput
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, endereço ou e-mail"
              />
            </Field>
            <Field label="Situação do serviço">
              <Select value={situation} onChange={(event) => setSituation(event.target.value)}>
                <option value="all">Todas</option>
                <option value="active">Ativos</option>
                <option value="suspended">Suspensos</option>
              </Select>
            </Field>
            <Field label="Mensalidades">
              <Select value={finance} onChange={(event) => setFinance(event.target.value)}>
                <option value="all">Todas</option>
                <option value="overdue">Com vencidas</option>
                <option value="current">Sem vencidas</option>
              </Select>
            </Field>
          </div>

          <p className="text-[13px] text-admin-muted" role="status">
            {rows.length === data.length
              ? `${data.length} restaurante(s)`
              : `${rows.length} de ${data.length} restaurante(s)`}
          </p>

          {rows.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="Nenhum restaurante encontrado"
              description="Ajuste a busca ou os filtros."
              action={
                filtering && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <DataTable
              caption="Restaurantes"
              columns={COLUMNS}
              rows={rows}
              getRowKey={(restaurant) => restaurant.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
