import { Button } from '../../../../components/ui/Button.jsx';
import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatMonth } from '../../../../utils/format-date.js';
import { InvoiceStatusBadge } from './InvoiceStatusBadge.jsx';

/**
 * Tabela de faturas com as ações de baixa manual.
 * `onChangeStatus(invoice, status)` deve persistir; `busyId` desabilita a linha em andamento.
 */
export function InvoiceTable({ invoices, showRestaurant = true, busyId, onChangeStatus }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {showRestaurant && <th className="px-3 py-2 font-medium">Restaurante</th>}
            <th className="px-3 py-2 font-medium">Referência</th>
            <th className="px-3 py-2 font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Vencimento</th>
            <th className="px-3 py-2 font-medium">Situação</th>
            <th className="px-3 py-2 font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => {
            const busy = busyId === invoice.id;
            return (
              <tr key={invoice.id}>
                {showRestaurant && (
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {invoice.restaurant.name}
                  </td>
                )}
                <td className="px-3 py-2">{formatMonth(invoice.referenceMonth)}</td>
                <td className="px-3 py-2">{formatPrice(invoice.amount)}</td>
                <td className="px-3 py-2">{formatDate(invoice.dueDate)}</td>
                <td className="px-3 py-2">
                  <InvoiceStatusBadge invoice={invoice} />
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {invoice.status === 'OPEN' && (
                    <>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => onChangeStatus(invoice, 'PAID')}
                      >
                        Marcar como paga
                      </Button>{' '}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onChangeStatus(invoice, 'CANCELED')}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {invoice.status !== 'OPEN' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => onChangeStatus(invoice, 'OPEN')}
                    >
                      Reabrir
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
