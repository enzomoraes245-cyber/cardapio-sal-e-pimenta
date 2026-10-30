import { useState } from 'react';
import { Button } from '../../../../components/admin/Button.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { Field, inputClass } from '../../../../components/admin/Field.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import { createAdmin, resetAdminPassword } from '../services/platform-restaurants.service.js';
import { adminSchema, passwordSchema } from '../validators/restaurant.schema.js';

const EMPTY_ADMIN = { name: '', email: '', password: '' };

/** Administradores da retaguarda do restaurante: cadastro e redefinição de senha. */
export function AdminsCard({ restaurant, onUpdated }) {
  const [values, setValues] = useState(EMPTY_ADMIN);
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(adminSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    const ok = await run(async () => {
      const admin = await createAdmin(restaurant.id, data);
      onUpdated({ ...restaurant, admins: [...restaurant.admins, admin] });
    }, 'Administrador cadastrado.');
    if (ok) setValues(EMPTY_ADMIN);
  }

  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setValues((previous) => ({ ...previous, [field]: event.target.value })),
    className: inputClass,
  });
  const apiErrors = apiValidationErrors(feedback?.error) ?? {};

  return (
    <Panel title="Administradores" description="Acessam a retaguarda deste restaurante.">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {restaurant.admins.map((admin) => (
          <AdminRow key={admin.id} restaurantId={restaurant.id} admin={admin} />
        ))}
      </ul>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <p className="text-sm font-medium text-slate-800">Adicionar administrador</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nome" error={errors.name}>
            <input {...bind('name')} maxLength={120} />
          </Field>
          <Field label="E-mail" error={errors.email ?? apiErrors['admin.email']}>
            <input type="email" autoComplete="off" {...bind('email')} />
          </Field>
          <Field label="Senha inicial" error={errors.password}>
            <input type="password" autoComplete="new-password" {...bind('password')} />
          </Field>
        </div>
        <FormFeedback feedback={feedback} />
        <Button type="submit" variant="secondary" disabled={submitting}>
          Adicionar
        </Button>
      </form>
    </Panel>
  );
}

function AdminRow({ restaurantId, admin }) {
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState('');
  const { submitting, feedback, setFeedback, run } = useSubmit();

  async function handleReset(event) {
    event.preventDefault();
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      return setFeedback({ tone: 'error', message: result.error.issues[0].message });
    }
    const ok = await run(
      () => resetAdminPassword(restaurantId, admin.id, password),
      'Senha redefinida. As sessões abertas foram encerradas.',
    );
    if (ok) {
      setResetting(false);
      setPassword('');
    }
  }

  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{admin.name}</p>
          <p className="text-sm text-slate-600">{admin.email}</p>
        </div>
        {!resetting && (
          <Button size="sm" variant="secondary" onClick={() => setResetting(true)}>
            Redefinir senha
          </Button>
        )}
      </div>
      {resetting && (
        <form onSubmit={handleReset} noValidate className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Field label={`Nova senha de ${admin.name}`}>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setResetting(false)}>
            Cancelar
          </Button>
        </form>
      )}
      <FormFeedback feedback={feedback} />
    </li>
  );
}
