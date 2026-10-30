import { useState } from 'react';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { Field } from '../../../components/admin/Field.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../components/admin/Panel.jsx';
import { PasswordInput } from '../../../components/admin/PasswordInput.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { useSubmit } from '../../../hooks/useSubmit.js';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { RESTAURANT_AREA } from '../areas.js';
import { useSession } from '../hooks/useSession.js';
import { changePasswordSchema } from '../validators/password.schema.js';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

function Detail({ label, children }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-admin-faint">{label}</dt>
      <dd className="text-sm font-medium text-admin-text">{children}</dd>
    </div>
  );
}

/** "Minha conta": dados de acesso e troca da própria senha (retaguarda e backoffice). */
export function AccountPage({ area = RESTAURANT_AREA }) {
  const { admin, restaurant } = useSession();
  const toast = useToast();
  const { submitting, feedback, run } = useSubmit();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const update = (field) => (event) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(changePasswordSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    let apiErrors = null;
    const ok = await run(async () => {
      try {
        await area.account.changePassword(data);
      } catch (error) {
        apiErrors = apiValidationErrors(error);
        throw error;
      }
    });
    if (ok) {
      setValues(EMPTY);
      toast.success('Senha alterada. As outras sessões abertas foram encerradas.');
    } else if (apiErrors) {
      setErrors(apiErrors);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Minha conta"
        description="Seus dados de acesso e a senha usada para entrar."
      />

      <Panel title="Dados de acesso">
        <dl className="grid gap-5 sm:grid-cols-3">
          <Detail label="Nome">{admin?.name}</Detail>
          <Detail label="E-mail">{admin?.email}</Detail>
          <Detail label="Área">
            {restaurant ? `${area.environmentLong} · ${restaurant.name}` : area.environmentLong}
          </Detail>
        </dl>
      </Panel>

      <Panel
        title="Alterar senha"
        description="Ao salvar, as outras sessões abertas com a sua conta são encerradas."
      >
        <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-5">
          {feedback?.tone === 'error' && !errors.currentPassword && (
            <Alert tone="danger">{feedback.message}</Alert>
          )}
          <Field label="Senha atual" error={errors.currentPassword} required>
            <PasswordInput
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={update('currentPassword')}
            />
          </Field>
          <Field
            label="Nova senha"
            hint="Ao menos 8 caracteres."
            error={errors.newPassword}
            required
          >
            <PasswordInput
              autoComplete="new-password"
              value={values.newPassword}
              onChange={update('newPassword')}
            />
          </Field>
          <Field label="Confirme a nova senha" error={errors.confirmPassword} required>
            <PasswordInput
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={update('confirmPassword')}
            />
          </Field>
          <Button type="submit" loading={submitting}>
            Salvar nova senha
          </Button>
        </form>
      </Panel>
    </div>
  );
}
