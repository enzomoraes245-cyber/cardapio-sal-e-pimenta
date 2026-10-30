import { useState } from 'react';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { DescriptionList } from '../../../../components/admin/DescriptionList.jsx';
import { Field, TextInput } from '../../../../components/admin/Field.jsx';
import { PencilIcon } from '../../../../components/admin/icons.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { formatDateTime } from '../../../../utils/format-date.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { updateRestaurant } from '../services/platform-restaurants.service.js';
import { registrationSchema } from '../validators/restaurant.schema.js';

const toValues = (restaurant) => ({
  name: restaurant.name,
  contactPhone: restaurant.contactPhone ?? '',
  contactEmail: restaurant.contactEmail ?? '',
});

/** Dados cadastrais (nome e contato), com edição no próprio painel. */
export function RegistrationPanel({ restaurant, onUpdated }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => toValues(restaurant));
  const [errors, setErrors] = useState({});
  const { submitting, feedback, setFeedback, run } = useSubmit();

  function startEditing() {
    setValues(toValues(restaurant));
    setErrors({});
    setFeedback(null);
    setEditing(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(registrationSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    const ok = await run(async () => {
      try {
        onUpdated(await updateRestaurant(restaurant.id, data));
      } catch (error) {
        setErrors(apiValidationErrors(error) ?? {});
        throw error;
      }
    });
    if (ok) {
      setEditing(false);
      toast.success('Dados cadastrais atualizados.');
    }
  }

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
  });

  return (
    <Panel
      title="Dados cadastrais"
      description="O contato é de uso interno da plataforma e não aparece no cardápio."
      actions={
        !editing && (
          <Button variant="secondary" size="sm" icon={PencilIcon} onClick={startEditing}>
            Editar
          </Button>
        )
      }
    >
      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {feedback?.tone === 'error' && <Alert tone="danger">{feedback.message}</Alert>}
          <Field label="Nome do restaurante" error={errors.name} required>
            <TextInput maxLength={120} {...bind('name')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefone de contato" error={errors.contactPhone} optional>
              <TextInput type="tel" inputMode="tel" {...bind('contactPhone')} />
            </Field>
            <Field label="E-mail de contato" error={errors.contactEmail} optional>
              <TextInput type="email" inputMode="email" {...bind('contactEmail')} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={submitting}>
              Salvar dados
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <DescriptionList
          items={[
            { label: 'Nome', value: restaurant.name },
            { label: 'Endereço público', value: `/cardapio/${restaurant.slug}` },
            { label: 'Telefone de contato', value: restaurant.contactPhone },
            { label: 'E-mail de contato', value: restaurant.contactEmail },
            { label: 'Cadastrado em', value: formatDateTime(restaurant.createdAt) },
          ]}
        />
      )}
    </Panel>
  );
}
