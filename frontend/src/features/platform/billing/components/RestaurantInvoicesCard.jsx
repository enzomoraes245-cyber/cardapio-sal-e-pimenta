import { useCallback, useState } from 'react';
import { LinkButton } from '../../../../components/admin/Button.jsx';
import { BanknoteIcon, ReceiptIcon } from '../../../../components/admin/icons.jsx';
import { Pagination } from '../../../../components/admin/Pagination.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { useInvoiceActions } from '../hooks/useInvoiceActions.jsx';
import { listInvoices } from '../services/billing.service.js';
import { InvoiceTable } from './InvoiceTable.jsx';

const PAGE_SIZE = 12;

/** Mensalidades de um restaurante, da mais recente para a mais antiga, com as ações de cobrança. */
export function RestaurantInvoicesCard({ restaurantId, onInvoiceChanged }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(
    ({ signal }) => listInvoices({ restaurantId, page, pageSize: PAGE_SIZE }, { signal }),
    [restaurantId, page],
  );
  const { status, data, error, reload } = useResource(loader);
  const handleChanged = useCallback(() => {
    reload();
    onInvoiceChanged?.();
  }, [reload, onInvoiceChanged]);
  const actions = useInvoiceActions({ onChanged: handleChanged });

  return (
    <Panel
      title="Mensalidades"
      description="Geradas mês a mês na página Mensalidades. Pagamentos, estornos e cancelamentos ficam registrados."
      actions={
        <LinkButton
          to={`/backoffice/pagamentos?periodo=todos&restaurante=${restaurantId}&estornados=1`}
          size="sm"
          icon={BanknoteIcon}
        >
          Ver pagamentos
        </LinkButton>
      }
    >
      {status === 'loading' && <LoadingState label="Carregando mensalidades..." rows={2} />}
      {status === 'error' && (
        <ErrorState
          title="Não foi possível carregar as mensalidades"
          error={error}
          onRetry={reload}
        />
      )}
      {status === 'success' && data.items.length === 0 && (
        <EmptyState
          icon={ReceiptIcon}
          title="Nenhuma mensalidade gerada"
          description="As mensalidades aparecem aqui depois de geradas na página Mensalidades."
        />
      )}
      {status === 'success' && data.items.length > 0 && (
        <>
          <InvoiceTable
            invoices={data.items}
            showRestaurant={false}
            onAction={actions.open}
            caption="Mensalidades do restaurante"
          />
          {data.total > data.pageSize && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onChange={setPage}
              label="Páginas de mensalidades"
            />
          )}
        </>
      )}
      {actions.dialogs}
    </Panel>
  );
}
