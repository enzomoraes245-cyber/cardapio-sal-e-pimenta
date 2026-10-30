import { Link } from 'react-router';
import { Badge } from '../../../../components/admin/Badge.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { DataTable } from '../../../../components/admin/DataTable.jsx';
import { BanknoteIcon, RefreshIcon, UndoIcon } from '../../../../components/admin/icons.jsx';
import { formatPrice } from '../../../../utils/format-currency.js';
import {
  daysBetween,
  formatDate,
  formatMonth,
  todayIsoDate,
} from '../../../../utils/format-date.js';
import { plural } from '../../../../utils/plural.js';
import { paymentMethodLabel } from '../utils/billing-labels.js';
import { InvoiceSituationBadge } from './InvoiceSituationBadge.jsx';

/**
 * Texto escondido que completa o nome do botão para leitores de tela ("... de mar. de 2026").
 * O espaço fica fora do span: o cálculo do nome acessível descarta espaços nas bordas do span.
 */
function RowContext({ invoice, showRestaurant }) {
  return (
    <>
      {' '}
      <span className="sr-only">
        de {formatMonth(invoice.referenceMonth)}
        {showRestaurant && ` · ${invoice.restaurant.name}`}
      </span>
    </>
  );
}

function SituationCell({ invoice, today }) {
  const { payment } = invoice;
  return (
    <div className="space-y-1 max-md:text-right">
      <InvoiceSituationBadge situation={invoice.situation} />
      {invoice.situation === 'overdue' && (
        <p className="text-xs text-admin-danger">
          Venceu há {plural(daysBetween(invoice.dueDate, today), 'dia')}
        </p>
      )}
      {payment && (
        <p className="text-xs text-admin-muted">
          Pago em {formatDate(payment.paidOn)} · {paymentMethodLabel(payment.method)}
        </p>
      )}
      {invoice.situation === 'canceled' && invoice.cancelReason && (
        <p className="max-w-56 truncate text-xs text-admin-muted" title={invoice.cancelReason}>
          {invoice.cancelReason}
        </p>
      )}
    </div>
  );
}

/**
 * Mensalidades com as ações de cobrança manual. `onAction(tipo, mensalidade)` abre a confirmação:
 * "pay" (registrar pagamento), "cancel", "void" (estornar) ou "reopen".
 */
export function InvoiceTable({ invoices, showRestaurant = true, onAction, caption }) {
  const today = todayIsoDate();
  const columns = [
    showRestaurant && {
      key: 'restaurant',
      header: 'Restaurante',
      primary: true,
      cell: (invoice) => (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            to={`/backoffice/restaurantes/${invoice.restaurant.id}?aba=financeiro`}
            className="font-medium text-admin-text hover:text-admin-accent focus-visible:outline-2 focus-visible:outline-admin-accent"
          >
            {invoice.restaurant.name}
          </Link>
          {invoice.restaurant.status === 'SUSPENDED' && <Badge tone="neutral">Suspenso</Badge>}
        </div>
      ),
    },
    {
      key: 'month',
      header: 'Competência',
      primary: !showRestaurant,
      cell: (invoice) => (
        <span className={showRestaurant ? undefined : 'font-medium'}>
          {formatMonth(invoice.referenceMonth)}
        </span>
      ),
    },
    {
      key: 'due',
      header: 'Vencimento',
      cell: (invoice) => <span className="tabular-nums">{formatDate(invoice.dueDate)}</span>,
    },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      cell: (invoice) => formatPrice(invoice.amount),
    },
    {
      key: 'situation',
      header: 'Situação',
      cell: (invoice) => <SituationCell invoice={invoice} today={today} />,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      cell: (invoice) => {
        const context = <RowContext invoice={invoice} showRestaurant={showRestaurant} />;
        if (invoice.status === 'OPEN') {
          return (
            <div className="flex flex-wrap justify-end gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                icon={BanknoteIcon}
                onClick={() => onAction('pay', invoice)}
              >
                Registrar pagamento{context}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAction('cancel', invoice)}>
                Cancelar{context}
              </Button>
            </div>
          );
        }
        if (invoice.status === 'PAID') {
          return (
            <Button
              variant="danger-ghost"
              size="sm"
              icon={UndoIcon}
              onClick={() => onAction('void', invoice)}
            >
              Estornar pagamento{context}
            </Button>
          );
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshIcon}
            onClick={() => onAction('reopen', invoice)}
          >
            Reabrir{context}
          </Button>
        );
      },
    },
  ].filter(Boolean);

  return (
    <DataTable
      caption={caption}
      columns={columns}
      rows={invoices}
      getRowKey={(invoice) => invoice.id}
    />
  );
}
