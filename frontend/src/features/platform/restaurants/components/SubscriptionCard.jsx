import { useState } from 'react';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { AffixInput, Field, TextInput } from '../../../../components/admin/Field.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { todayIsoDate } from '../../../../utils/format-date.js';
import { formatMoneyInput } from '../../../../utils/money-input.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { updateSubscription } from '../services/platform-restaurants.service.js';
import { subscriptionSchema } from '../validators/restaurant.schema.js';

function initialValues(subscription) {
  return {
    monthlyAmount: formatMoneyInput(subscription?.monthlyAmount),
    dueDay: String(subscription?.dueDay ?? 10),
    startedAt: subscription?.startedAt ?? todayIsoDate(),
  };
}

/**
 * Mensalidade, dia de vencimento e início da cobrança. Vale para as próximas mensalidades
 * geradas: as já geradas mantêm o valor da época (a alteração fica no histórico).
 */
export function SubscriptionCard({ restaurant, onUpdated }) {
  const [values, setValues] = useState(() => initialValues(restaurant.subscription));
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(
      subscriptionSchema.required({ startedAt: true }),
      values,
    );
    setErrors(fieldErrors ?? {});
    if (!data) return;
    await run(async () => {
      try {
        const subscription = await updateSubscription(restaurant.id, data);
        onUpdated({ ...restaurant, subscription });
      } catch (error) {
        setErrors(apiValidationErrors(error) ?? {});
        throw error;
      }
    }, 'Assinatura salva. Vale para as próximas mensalidades geradas.');
  }

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
  });

  return (
    <Panel
      title="Assinatura"
      description="Cobrança manual, sem gateway. Alterações valem para as próximas mensalidades; as já geradas mantêm o valor."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mensalidade" error={errors.monthlyAmount} required>
            <AffixInput prefix="R$" inputMode="decimal" {...bind('monthlyAmount')} />
          </Field>
          <Field label="Dia de vencimento" hint="Entre 1 e 28." error={errors.dueDay} required>
            <TextInput type="number" min={1} max={28} {...bind('dueDay')} />
          </Field>
          <Field
            label="Início da cobrança"
            hint="Meses a partir deste entram na geração."
            error={errors.startedAt}
            required
          >
            <TextInput type="date" {...bind('startedAt')} />
          </Field>
        </div>
        <FormFeedback feedback={feedback} />
        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Salvar assinatura
          </Button>
        </div>
      </form>
    </Panel>
  );
}
