import { useState } from 'react';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { CopyButton } from '../../../components/admin/CopyButton.jsx';
import { Field, TextInput } from '../../../components/admin/Field.jsx';
import { FormSection } from '../../../components/admin/FormSection.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { useSubmit } from '../../../hooks/useSubmit.js';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { useSession } from '../../auth/hooks/useSession.js';
import { getEstablishment, updateEstablishment } from '../services/establishment.service.js';
import { establishmentSchema } from '../validators/establishment.schema.js';

function EstablishmentForm({ establishment, onSaved }) {
  const [values, setValues] = useState({
    name: establishment.name,
    contactPhone: establishment.contactPhone ?? '',
    contactEmail: establishment.contactEmail ?? '',
  });
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(establishmentSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    await run(async () => {
      try {
        onSaved(await updateEstablishment(data));
      } catch (error) {
        setErrors(apiValidationErrors(error) ?? {});
        throw error;
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-admin-panel border border-admin-line bg-admin-surface"
    >
      <div className="px-5 py-8 sm:px-8">
        {feedback?.tone === 'error' && (
          <Alert tone="danger" className="mb-8">
            {feedback.message}
          </Alert>
        )}
        <FormSection
          title="Identificação"
          description="O nome aparece no topo do cardápio. Alterá-lo não muda o endereço nem o QR Code."
        >
          <Field label="Nome do restaurante" error={errors.name} required>
            <TextInput maxLength={120} {...bind('name')} />
          </Field>
        </FormSection>
        <FormSection
          title="Contato"
          description="Usado pela plataforma para falar com você (cobrança e suporte). Não aparece no cardápio."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefone" error={errors.contactPhone} optional>
              <TextInput
                type="tel"
                inputMode="tel"
                placeholder="(11) 91234-5678"
                {...bind('contactPhone')}
              />
            </Field>
            <Field label="E-mail de contato" error={errors.contactEmail} optional>
              <TextInput type="email" inputMode="email" {...bind('contactEmail')} />
            </Field>
          </div>
        </FormSection>
        <FormSection
          title="Endereço público"
          description="Definido no cadastro e permanente: o QR Code impresso continua válido."
        >
          <div className="space-y-3">
            <p className="rounded-admin-control border border-admin-line bg-admin-subtle px-3 py-2.5 text-sm break-all text-admin-text">
              {establishment.publicUrl}
            </p>
            <CopyButton text={establishment.publicUrl} label="Copiar endereço" size="sm" />
          </div>
        </FormSection>
      </div>
      <div className="flex justify-end rounded-b-admin-panel border-t border-admin-line bg-admin-subtle px-5 py-4 sm:px-8">
        <Button type="submit" loading={submitting}>
          Salvar dados
        </Button>
      </div>
    </form>
  );
}

/** Dados do estabelecimento (DEC-009): sempre disponível, mesmo sem o módulo de personalização. */
export function EstablishmentPage() {
  const { refresh: refreshSession } = useSession();
  const toast = useToast();
  const { status, data, error, reload, setData } = useResource(getEstablishment);

  function handleSaved(updated) {
    setData(updated);
    // Atualiza o nome exibido na barra lateral.
    refreshSession();
    toast.success('Dados do estabelecimento salvos.');
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dados do estabelecimento"
        description="Nome exibido no cardápio e contato usado pela plataforma."
      />
      {status === 'loading' && <LoadingState label="Carregando dados..." rows={3} />}
      {status === 'error' && (
        <ErrorState title="Não foi possível carregar os dados" error={error} onRetry={reload} />
      )}
      {status === 'success' && (
        <EstablishmentForm key={data.name} establishment={data} onSaved={handleSaved} />
      )}
    </div>
  );
}
