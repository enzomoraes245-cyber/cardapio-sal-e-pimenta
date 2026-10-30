import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, inputClass } from '../../../components/admin/Field.jsx';
import { validateForm } from '../../../utils/validate-form.js';
import { useSession } from '../hooks/useSession.js';
import { loginSchema } from '../validators/login.schema.js';

/* global __DEV_LOGINS__ */
// Contas de teste do seed, definidas pelo vite.config.js apenas em `vite dev` (vazio no build).
const DEV_LOGINS = typeof __DEV_LOGINS__ === 'undefined' ? [] : __DEV_LOGINS__;

/** Tela de login reutilizada pela retaguarda (/admin) e pelo backoffice (/backoffice). */
export function LoginPage({
  title = 'Retaguarda',
  description = 'Entre para gerenciar o cardápio do seu restaurante.',
  homePath = '/admin',
  devArea = 'admin',
}) {
  const { status, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const devLogins = DEV_LOGINS.filter((account) => account.area === devArea);
  const [values, setValues] = useState(() => ({
    email: devLogins[0]?.email ?? '',
    password: devLogins[0]?.password ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.startsWith(homePath) ? location.state.from : homePath;
  if (status === 'authenticated') return <Navigate to={redirectTo} replace />;

  const updateField = (field) => (event) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const { data, errors: fieldErrors } = validateForm(loginSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await login(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        {devLogins.length > 0 && (
          <Field label="Usuário de teste">
            <select
              value={values.email}
              onChange={(event) => {
                const account = devLogins.find((item) => item.email === event.target.value);
                if (account) setValues({ email: account.email, password: account.password });
              }}
              className={inputClass}
            >
              {devLogins.map((account) => (
                <option key={account.email} value={account.email}>
                  {account.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="E-mail" error={errors.email}>
          <input
            type="email"
            autoComplete="username"
            value={values.email}
            onChange={updateField('email')}
            className={inputClass}
          />
        </Field>

        <Field label="Senha" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={updateField('password')}
            className={inputClass}
          />
        </Field>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
