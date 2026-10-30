import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button, LinkButton } from '../../../../components/admin/Button.jsx';
import {
  AddonInput,
  AffixInput,
  Field,
  Switch,
  TextInput,
} from '../../../../components/admin/Field.jsx';
import { FormSection } from '../../../../components/admin/FormSection.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { PasswordInput } from '../../../../components/admin/PasswordInput.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { createRequestId } from '../../../../utils/request-id.js';
import { slugify } from '../../../../utils/slugify.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { createRestaurant } from '../services/platform-restaurants.service.js';
import { ALL_FEATURES_ENABLED, FEATURE_LABELS } from '../utils/feature-labels.js';
import { newRestaurantSchema } from '../validators/restaurant.schema.js';

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const initialValues = () => ({
  name: '',
  slug: '',
  contactPhone: '',
  contactEmail: '',
  admin: { name: '', email: '', password: '' },
  subscription: { monthlyAmount: '', dueDay: '10', startedAt: todayIso() },
  features: ALL_FEATURES_ENABLED,
});

/** Leva o foco ao primeiro campo com erro depois de uma tentativa de envio. */
function useFocusFirstError(formRef, errors) {
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [formRef, errors]);
}

/** Cadastro de restaurante com o primeiro responsável, assinatura e módulos (DEC-006). */
export function NewRestaurantPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState({});
  // Uma chave por formulário: reenviar (clique duplo, nova tentativa) não duplica o cadastro.
  const [requestId] = useState(createRequestId);
  const { submitting, feedback, run } = useSubmit();
  useFocusFirstError(formRef, errors);

  const set = (path, value) =>
    setValues((previous) => {
      const [group, field] = path.split('.');
      return field
        ? { ...previous, [group]: { ...previous[group], [field]: value } }
        : { ...previous, [group]: value };
    });
  const bind = (path) => ({
    value: path.split('.').reduce((object, key) => object[key], values),
    onChange: (event) => set(path, event.target.value),
  });

  function handleNameChange(event) {
    set('name', event.target.value);
    // Sugere o endereço a partir do nome até o operador editá-lo manualmente.
    if (!slugEdited) set('slug', slugify(event.target.value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(newRestaurantSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    let created;
    const ok = await run(async () => {
      try {
        created = await createRestaurant(data, { idempotencyKey: requestId });
      } catch (error) {
        const apiErrors = apiValidationErrors(error);
        if (apiErrors) setErrors(apiErrors);
        throw error;
      }
    });
    if (ok) {
      toast.success(`${created.name} cadastrado.`);
      navigate(`/backoffice/restaurantes/${created.id}`);
    }
  }

  const publicUrl = `${window.location.origin}/cardapio/${values.slug || '…'}`;

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ to: '/backoffice/restaurantes', label: 'Restaurantes' }}
        title="Novo restaurante"
        description="Cadastra o restaurante, o primeiro responsável pelo painel e a assinatura mensal."
      />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="rounded-admin-panel border border-admin-line bg-admin-surface"
      >
        <div className="px-5 py-8 sm:px-8">
          {feedback?.tone === 'error' && (
            <Alert tone="danger" className="mb-8" title="Não foi possível cadastrar">
              {feedback.message}
            </Alert>
          )}

          <FormSection
            title="Restaurante"
            description="O endereço público é usado no cardápio e no QR Code e não pode ser alterado depois."
          >
            <Field label="Nome" error={errors.name} required>
              <TextInput
                value={values.name}
                onChange={handleNameChange}
                maxLength={120}
                autoComplete="off"
              />
            </Field>
            <Field label="Endereço público" hint={publicUrl} error={errors.slug} required>
              <AddonInput
                addon="/cardapio/"
                value={values.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  set('slug', event.target.value.toLowerCase());
                }}
                maxLength={80}
                autoComplete="off"
              />
            </Field>
          </FormSection>

          <FormSection
            title="Contato"
            description="Uso interno da plataforma (cobrança e suporte). Não aparece no cardápio."
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
            title="Responsável"
            description="Primeiro acesso ao painel do restaurante. Depois de entrar, ele pode trocar a senha em Minha conta."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome" error={errors['admin.name']} required>
                <TextInput {...bind('admin.name')} maxLength={120} />
              </Field>
              <Field label="E-mail de acesso" error={errors['admin.email']} required>
                <TextInput type="email" autoComplete="off" {...bind('admin.email')} />
              </Field>
            </div>
            <Field
              label="Senha inicial"
              hint="Ao menos 8 caracteres."
              error={errors['admin.password']}
              required
              className="sm:max-w-sm"
            >
              <PasswordInput autoComplete="new-password" {...bind('admin.password')} />
            </Field>
          </FormSection>

          <FormSection
            title="Assinatura"
            description="Cobrança manual: as mensalidades são geradas no backoffice a partir do mês de início. Alterações futuras não mudam mensalidades já geradas."
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Mensalidade" error={errors['subscription.monthlyAmount']} required>
                <AffixInput
                  prefix="R$"
                  inputMode="decimal"
                  placeholder="99,90"
                  {...bind('subscription.monthlyAmount')}
                />
              </Field>
              <Field
                label="Dia de vencimento"
                hint="Entre 1 e 28."
                error={errors['subscription.dueDay']}
                required
              >
                <TextInput type="number" min={1} max={28} {...bind('subscription.dueDay')} />
              </Field>
              <Field label="Início da cobrança" error={errors['subscription.startedAt']} required>
                <TextInput type="date" {...bind('subscription.startedAt')} />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Módulos"
            description="Recursos liberados para este restaurante. Podem ser alterados a qualquer momento."
          >
            <div className="space-y-4">
              {FEATURE_LABELS.map(({ key, label, hint }) => (
                <Switch
                  key={key}
                  label={label}
                  description={hint}
                  checked={values.features[key]}
                  onChange={(checked) => set('features', { ...values.features, [key]: checked })}
                />
              ))}
            </div>
          </FormSection>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 rounded-b-admin-panel border-t border-admin-line bg-admin-subtle/95 px-5 py-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-8">
          <LinkButton to="/backoffice/restaurantes" variant="secondary">
            Cancelar
          </LinkButton>
          <Button type="submit" loading={submitting}>
            Cadastrar restaurante
          </Button>
        </div>
      </form>
    </div>
  );
}
