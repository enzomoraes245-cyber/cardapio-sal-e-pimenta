import { useCallback, useState } from 'react';
import { Button } from '../../../../components/ui/Button.jsx';
import { FormFeedback } from '../../../../components/ui/FormFeedback.jsx';
import { INPUT_CLASS } from '../../../../components/ui/FormField.jsx';
import { Spinner } from '../../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { currentIsoMonth, formatMonth } from '../../../../utils/format-date.js';
import { InvoiceTable } from '../components/InvoiceTable.jsx';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus.js';
import { generateInvoices, listInvoices } from '../services/billing.service.js';

const FILTERS = [
  { id: 'all', label: 'Todas', query: {} },
  { id: 'overdue', label: 'Vencidas', query: { overdue: 'true' } },
  { id: 'open', label: 'Em aberto', query: { status: 'OPEN' } },
  { id: 'paid', label: 'Pagas', query: { status: 'PAID' } },
];

/** Cobrança manual (DEC-006, item 2): gerar faturas do mês e dar baixa. */
export function InvoicesPage() {
  const [month, setMonth] = useState(currentIsoMonth());
  const [filterId, setFilterId] = useState('overdue');
  const filter = FILTERS.find((f) => f.id === filterId);

  const loader = useCallback(({ signal }) => listInvoices(filter.query, { signal }), [filter]);
  const { status, data, error, reload, setData } = useResource(loader);
  const generation = useSubmit();
  const handleUpdated = useCallback(
    (updated) => setData((invoices) => invoices.map((i) => (i.id === updated.id ? updated : i))),
    [setData],
  );
  const invoiceStatus = useInvoiceStatus({ onUpdated: handleUpdated });

  async function handleGenerate() {
    let result;
    const ok = await generation.run(async () => {
      result = await generateInvoices(month);
    });
    if (!ok) return;
    generation.setFeedback({
      tone: 'success',
      message:
        result.created > 0
          ? `${result.created} fatura(s) gerada(s) para ${formatMonth(month)}.`
          : `Nenhuma fatura nova: as de ${formatMonth(month)} já existem.`,
    });
    reload();
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Faturas</h1>
        <p className="mt-1 text-slate-600">
          Cobrança manual: gere as faturas do mês e registre os pagamentos recebidos.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="space-y-1 text-sm font-medium text-slate-800">
          <span className="block">Mês de referência</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className={`${INPUT_CLASS} w-auto`}
          />
        </label>
        <Button disabled={generation.submitting || !month} onClick={handleGenerate}>
          {generation.submitting ? 'Gerando...' : 'Gerar faturas do mês'}
        </Button>
        <p className="w-full text-xs text-slate-500">
          Gera uma fatura por restaurante ativo com assinatura. Repetir não duplica faturas.
        </p>
        <div className="w-full">
          <FormFeedback feedback={generation.feedback} />
        </div>
      </div>

      <div role="group" aria-label="Filtrar faturas" className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={item.id === filterId ? 'primary' : 'secondary'}
            aria-pressed={item.id === filterId}
            onClick={() => setFilterId(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {invoiceStatus.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {invoiceStatus.error}
        </p>
      )}
      {status === 'loading' && <Spinner label="Carregando faturas..." />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar as faturas"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && data.length === 0 && (
        <StatusMessage title="Nenhuma fatura neste filtro" />
      )}
      {status === 'success' && data.length > 0 && (
        <InvoiceTable
          invoices={data}
          busyId={invoiceStatus.busyId}
          onChangeStatus={invoiceStatus.changeStatus}
        />
      )}
    </section>
  );
}
