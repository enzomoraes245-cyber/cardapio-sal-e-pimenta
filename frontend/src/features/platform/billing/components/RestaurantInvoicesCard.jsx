import { useCallback } from 'react';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { Spinner } from '../../../../components/ui/Spinner.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus.js';
import { listInvoices } from '../services/billing.service.js';
import { InvoiceTable } from './InvoiceTable.jsx';

/** Faturas de um restaurante, com baixa manual. */
export function RestaurantInvoicesCard({ restaurantId, onInvoiceChanged }) {
  const loader = useCallback(
    ({ signal }) => listInvoices({ restaurantId }, { signal }),
    [restaurantId],
  );
  const { status, data, error, setData } = useResource(loader);
  const handleUpdated = useCallback(
    (updated) => {
      setData((invoices) => invoices.map((i) => (i.id === updated.id ? updated : i)));
      onInvoiceChanged?.();
    },
    [setData, onInvoiceChanged],
  );
  const invoiceStatus = useInvoiceStatus({ onUpdated: handleUpdated });

  return (
    <Panel title="Faturas" description="Geradas mensalmente na página Faturas.">
      {status === 'loading' && <Spinner />}
      {status === 'error' && <p className="text-sm text-red-700">{error.message}</p>}
      {status === 'success' && data.length === 0 && (
        <p className="text-sm text-slate-600">Nenhuma fatura gerada para este restaurante.</p>
      )}
      {invoiceStatus.error && (
        <p role="alert" className="text-sm text-red-700">
          {invoiceStatus.error}
        </p>
      )}
      {status === 'success' && data.length > 0 && (
        <InvoiceTable
          invoices={data}
          showRestaurant={false}
          busyId={invoiceStatus.busyId}
          onChangeStatus={invoiceStatus.changeStatus}
        />
      )}
    </Panel>
  );
}
