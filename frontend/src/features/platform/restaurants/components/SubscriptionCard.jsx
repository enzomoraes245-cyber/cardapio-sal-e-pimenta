import { useState } from 'react';
import { Button } from '../../../../components/admin/Button.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { Field, inputClass } from '../../../../components/admin/Field.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { formatMoneyInput } from '../../../../utils/money-input.js';
import { validateForm } from '../../../../utils/validate-form.js';
import { updateSubscription } from '../services/platform-restaurants.service.js';
import { subscriptionSchema } from '../validators/restaurant.schema.js';

/** Mensalidade e dia de vencimento. Vale para as próximas faturas geradas. */
export function SubscriptionCard({ restaurant, onUpdated }) {
  const [values, setValues] = useState({
    monthlyAmount: formatMoneyInput(restaurant.subscription?.monthlyAmount),
    dueDay: String(restaurant.subscription?.dueDay ?? 10),
  });
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(subscriptionSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    await run(async () => {
      const subscription = await updateSubscription(restaurant.id, data);
      onUpdated({ ...restaurant, subscription });
    }, 'Assinatura atualizada. Vale para as próximas faturas.');
  }

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
    className: inputClass,
  });

  return (
    <Panel title="Assinatura" description="Cobrança manual, sem gateway de pagamento.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mensalidade (R$)" error={errors.monthlyAmount}>
            <input inputMode="decimal" {...bind('monthlyAmount')} />
          </Field>
          <Field label="Dia de vencimento" hint="Entre 1 e 28." error={errors.dueDay}>
            <input type="number" min={1} max={28} {...bind('dueDay')} />
          </Field>
        </div>
        <FormFeedback feedback={feedback} />
        <Button type="submit" disabled={submitting}>
          Salvar assinatura
        </Button>
      </form>
    </Panel>
  );
}
