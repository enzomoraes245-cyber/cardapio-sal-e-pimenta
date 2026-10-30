import { useId, useState } from 'react';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { Dialog } from '../../../../components/admin/Dialog.jsx';
import { Field, TextInput } from '../../../../components/admin/Field.jsx';
import { currentIsoMonth, formatMonth } from '../../../../utils/format-date.js';
import { plural } from '../../../../utils/plural.js';
import { generateInvoices } from '../services/billing.service.js';

const RULES = [
  'Uma mensalidade por restaurante ativo com assinatura iniciada até o fim do mês.',
  'Valor e dia de vencimento vêm da assinatura de cada restaurante.',
  'Restaurantes suspensos não recebem mensalidade.',
  'Pode repetir: mensalidades já geradas não são duplicadas nem alteradas.',
];

function resultMessage(result) {
  const month = formatMonth(result.month);
  if (result.billable === 0) {
    return { tone: 'info', text: `Nenhum restaurante ativo com assinatura para ${month}.` };
  }
  if (result.created === 0) {
    return {
      tone: 'info',
      text: `Nenhuma mensalidade nova: as de ${month} já existiam para os restaurantes faturáveis.`,
    };
  }
  return {
    tone: 'success',
    text: `${plural(result.created, 'mensalidade gerada', 'mensalidades geradas')} para ${month} (${plural(result.billable, 'restaurante faturável', 'restaurantes faturáveis')}).`,
  };
}

/** Geração manual das mensalidades de um mês, com o resumo do que foi criado. */
export function GenerateInvoicesDialog({ onGenerated, onClose }) {
  const formId = useId();
  const [month, setMonth] = useState(currentIsoMonth());
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      setError(new Error('Informe o mês de referência.'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const generated = await generateInvoices(month);
      setResult(generated);
      onGenerated(generated);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  }

  const message = result && resultMessage(result);

  return (
    <Dialog
      title="Gerar mensalidades"
      description="A cobrança é manual: gere as mensalidades do mês e registre os pagamentos recebidos."
      onClose={onClose}
      dismissible={!submitting}
      footer={
        result ? (
          <Button onClick={onClose}>Concluir</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} loading={submitting}>
              Gerar mensalidades
            </Button>
          </>
        )
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Mês de referência" required>
          <TextInput
            type="month"
            value={month}
            disabled={Boolean(result)}
            onChange={(event) => setMonth(event.target.value)}
          />
        </Field>
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-admin-muted marker:text-admin-faint">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {message && (
          <Alert tone={message.tone} role="status">
            {message.text}
          </Alert>
        )}
        {error && <Alert tone="danger">{error.message}</Alert>}
      </form>
    </Dialog>
  );
}
