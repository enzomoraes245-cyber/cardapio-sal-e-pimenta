import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button, LinkButton } from '../../../components/admin/Button.jsx';
import { Field } from '../../../components/admin/Field.jsx';
import { PasswordInput } from '../../../components/admin/PasswordInput.jsx';
import { useSubmit } from '../../../hooks/useSubmit.js';
import { validateForm } from '../../../utils/validate-form.js';
import { RESTAURANT_AREA } from '../areas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { resetPasswordSchema } from '../validators/password.schema.js';

const linkClass =
  'rounded-sm font-medium text-admin-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent';

/** Lê o token do fragmento (#token=...) e o retira do endereço exibido. */
function useTokenFromHash() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []);
  return token;
}

/** Criação da nova senha a partir do link recebido por e-mail. */
export function ResetPasswordPage({ area = RESTAURANT_AREA }) {
  const token = useTokenFromHash();
  const { submitting, feedback, run } = useSubmit();
  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const update = (field) => (event) =>
    setValues((previous) => ({ ...previous, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(resetPasswordSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    const ok = await run(() => area.account.resetPassword({ token, password: data.password }));
    if (ok) setDone(true);
  }

  const requestNewLink = (
    <Link to={area.forgotPath} className={linkClass}>
      Pedir um novo link
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout area={area} title="Link inválido">
        <Alert tone="danger">
          Abra o link completo recebido por e-mail ou peça um novo. {requestNewLink}
        </Alert>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout area={area} title="Senha redefinida">
        <Alert tone="success">
          Sua senha foi alterada e as sessões abertas foram encerradas. Entre com a nova senha.
        </Alert>
        <LinkButton to={area.loginPath} variant="primary" size="lg" block>
          Ir para o login
        </LinkButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      area={area}
      title="Criar nova senha"
      description="Use ao menos 8 caracteres. Depois de salvar, entre novamente com a nova senha."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {feedback?.tone === 'error' && (
          <Alert tone="danger">
            {feedback.message} {feedback.error?.code === 'INVALID_RESET_TOKEN' && requestNewLink}
          </Alert>
        )}
        <Field label="Nova senha" error={errors.password}>
          <PasswordInput
            autoComplete="new-password"
            value={values.password}
            onChange={update('password')}
          />
        </Field>
        <Field label="Confirme a nova senha" error={errors.confirmPassword}>
          <PasswordInput
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={update('confirmPassword')}
          />
        </Field>
        <Button type="submit" size="lg" block loading={submitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  );
}
