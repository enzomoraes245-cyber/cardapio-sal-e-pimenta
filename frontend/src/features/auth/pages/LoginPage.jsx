import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, Select, TextInput } from '../../../components/admin/Field.jsx';
import { PasswordInput } from '../../../components/admin/PasswordInput.jsx';
import { validateForm } from '../../../utils/validate-form.js';
import { RESTAURANT_AREA } from '../areas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { useRecoveryOptions } from '../hooks/useRecoveryOptions.js';
import { useSession } from '../hooks/useSession.js';
import { loginSchema } from '../validators/login.schema.js';

/* global __DEV_LOGINS__ */
// Contas de teste do seed, definidas pelo vite.config.js apenas em `vite dev` (vazio no build).
const DEV_LOGINS = typeof __DEV_LOGINS__ === 'undefined' ? [] : __DEV_LOGINS__;

/** Títulos para erros de acesso que não são de credenciais. */
const ERROR_TITLES = {
  RESTAURANT_SUSPENDED: 'Acesso suspenso',
  USER_DISABLED: 'Acesso bloqueado',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas',
};

const linkClass =
  'rounded-sm font-medium text-admin-accent underline-offset-4 hover:text-admin-accent-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent';

/** Tela de login da retaguarda (/admin) e do backoffice (/backoffice). */
export function LoginPage({ area = RESTAURANT_AREA }) {
  const { status, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const recovery = useRecoveryOptions(area);
  const devLogins = DEV_LOGINS.filter((account) => account.area === area.devArea);
  const [values, setValues] = useState(() => ({
    email: devLogins[0]?.email ?? '',
    password: devLogins[0]?.password ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const homePath = area.homePath;
  const redirectTo = location.state?.from?.startsWith(homePath) ? location.state.from : homePath;
  if (status === 'authenticated') return <Navigate to={redirectTo} replace />;

  const updateField = (field) => (event) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const { data, errors: fieldErrors } = validateForm(loginSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await login(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout area={area} title={area.loginTitle} description={area.loginDescription}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert tone="danger" title={ERROR_TITLES[formError.code]}>
            {formError.message}
          </Alert>
        )}

        {devLogins.length > 0 && (
          <Field label="Usuário de teste" hint="Disponível só no ambiente de desenvolvimento.">
            <Select
              value={values.email}
              onChange={(event) => {
                const account = devLogins.find((item) => item.email === event.target.value);
                if (account) setValues({ email: account.email, password: account.password });
              }}
            >
              {devLogins.map((account) => (
                <option key={account.email} value={account.email}>
                  {account.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="E-mail" error={errors.email}>
          <TextInput
            type="email"
            autoComplete="username"
            inputMode="email"
            value={values.email}
            onChange={updateField('email')}
          />
        </Field>

        <Field
          label="Senha"
          error={errors.password}
          action={
            recovery?.emailRecovery ? (
              <Link to={area.forgotPath} className={`text-[13px] ${linkClass}`}>
                Esqueci minha senha
              </Link>
            ) : null
          }
        >
          <PasswordInput
            autoComplete="current-password"
            value={values.password}
            onChange={updateField('password')}
          />
        </Field>

        <Button type="submit" size="lg" block loading={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      {recovery && !recovery.emailRecovery && (
        <p className="text-[13px] leading-relaxed text-admin-muted">
          Esqueceu a senha? {area.supportHint}
        </p>
      )}
    </AuthLayout>
  );
}
