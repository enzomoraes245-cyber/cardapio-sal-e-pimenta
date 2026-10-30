import { useId, useMemo, useState } from 'react';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { DescriptionList } from '../../../../components/admin/DescriptionList.jsx';
import { Dialog } from '../../../../components/admin/Dialog.jsx';
import { Field, Select, Textarea, TextInput } from '../../../../components/admin/Field.jsx';
import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatMonth, todayIsoDate } from '../../../../utils/format-date.js';
import { createRequestId } from '../../../../utils/request-id.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { PAYMENT_METHOD_LABELS } from '../utils/billing-labels.js';
import { paymentSchema } from '../validators/payment.schema.js';

/**
 * Registro manual do pagamento de uma mensalidade. O valor é sempre o da mensalidade.
 * `onSubmit(dados, { idempotencyKey })` deve lançar erro se falhar; a mesma chave vale para
 * todas as tentativas desta janela, então repetir o envio não duplica o pagamento.
 */
export function RecordPaymentDialog({ invoice, onSubmit, onClose }) {
  const formId = useId();
  const today = todayIsoDate();
  const idempotencyKey = useMemo(() => createRequestId(), []);
  const [values, setValues] = useState({ paidOn: today, method: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const { data, errors: fieldErrors } = validateForm(paymentSchema(today), values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...data, notes: data.notes || undefined }, { idempotencyKey });
    } catch (submitError) {
      setErrors(apiValidationErrors(submitError) ?? {});
      setError(submitError);
      setSubmitting(false);
      return;
    }
    onClose();
  }

  return (
    <Dialog
      title="Registrar pagamento"
      description="Confirme apenas valores já recebidos. O registro guarda quem registrou e quando."
      onClose={onClose}
      dismissible={!submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            Registrar pagamento
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="rounded-admin-control border border-admin-line bg-admin-subtle px-4 py-3">
          <DescriptionList
            items={[
              { label: 'Restaurante', value: invoice.restaurant.name },
              { label: 'Competência', value: formatMonth(invoice.referenceMonth) },
              { label: 'Vencimento', value: formatDate(invoice.dueDate) },
              {
                label: 'Valor',
                value: <span className="font-semibold">{formatPrice(invoice.amount)}</span>,
              },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data do pagamento" error={errors.paidOn} required>
            <TextInput type="date" max={today} {...bind('paidOn')} />
          </Field>
          <Field label="Forma de pagamento" error={errors.method} required>
            <Select {...bind('method')}>
              <option value="">Selecione...</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Observações"
          hint="Ex.: número do comprovante ou conta de destino."
          error={errors.notes}
          optional
        >
          <Textarea rows={2} maxLength={300} {...bind('notes')} />
        </Field>
        <p className="text-xs leading-relaxed text-admin-faint">
          O valor registrado é o da mensalidade. Pagamento parcial, juros, multa e desconto não são
          registrados pelo sistema.
        </p>
        {error && <Alert tone="danger">{error.message}</Alert>}
      </form>
    </Dialog>
  );
}
