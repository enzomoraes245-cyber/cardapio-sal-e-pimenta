import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../../../components/admin/Button.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { Field, inputClass } from '../../../../components/admin/Field.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { slugify } from '../../../../utils/slugify.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { FeatureCheckboxes } from '../components/FeatureCheckboxes.jsx';
import { createRestaurant } from '../services/platform-restaurants.service.js';
import { ALL_FEATURES_ENABLED } from '../utils/feature-labels.js';
import { newRestaurantSchema } from '../validators/restaurant.schema.js';

const INITIAL_VALUES = {
  name: '',
  slug: '',
  admin: { name: '', email: '', password: '' },
  subscription: { monthlyAmount: '', dueDay: '10' },
  features: ALL_FEATURES_ENABLED,
};

export function NewRestaurantPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

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
    className: inputClass,
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
      created = await createRestaurant(data);
    });
    if (ok) navigate(`/backoffice/restaurantes/${created.id}`);
  }

  const apiErrors = apiValidationErrors(feedback?.error) ?? {};
  const errorFor = (path) => errors[path] ?? apiErrors[path];

  return (
    <section className="space-y-6">
      <div>
        <Link to="/backoffice" className="text-sm text-slate-600 hover:underline">
          ← Restaurantes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Novo restaurante</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Panel title="Restaurante">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome" error={errorFor('name')}>
              <input {...bind('name')} onChange={handleNameChange} maxLength={120} />
            </Field>
            <Field
              label="Endereço do cardápio"
              hint={`/cardapio/${values.slug || '...'} — não pode ser alterado depois.`}
              error={errorFor('slug')}
            >
              <input
                {...bind('slug')}
                onChange={(event) => {
                  setSlugEdited(true);
                  set('slug', event.target.value.toLowerCase());
                }}
                maxLength={80}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Primeiro administrador" description="Acesso à retaguarda do restaurante.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Nome" error={errorFor('admin.name')}>
              <input {...bind('admin.name')} maxLength={120} />
            </Field>
            <Field label="E-mail" error={errorFor('admin.email')}>
              <input type="email" autoComplete="off" {...bind('admin.email')} />
            </Field>
            <Field
              label="Senha inicial"
              hint="Mínimo de 8 caracteres."
              error={errorFor('admin.password')}
            >
              <input type="password" autoComplete="new-password" {...bind('admin.password')} />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Assinatura"
          description="Cobrança manual: as faturas são geradas no backoffice."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Mensalidade (R$)"
              hint="Ex.: 99,90"
              error={errorFor('subscription.monthlyAmount')}
            >
              <input inputMode="decimal" {...bind('subscription.monthlyAmount')} />
            </Field>
            <Field
              label="Dia de vencimento"
              hint="Entre 1 e 28."
              error={errorFor('subscription.dueDay')}
            >
              <input type="number" min={1} max={28} {...bind('subscription.dueDay')} />
            </Field>
          </div>
        </Panel>

        <Panel title="Módulos liberados">
          <FeatureCheckboxes value={values.features} onChange={(value) => set('features', value)} />
        </Panel>

        <FormFeedback feedback={feedback} />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Cadastrar restaurante'}
        </Button>
      </form>
    </section>
  );
}
