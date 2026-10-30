import { useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, TextInput } from '../../../components/admin/Field.jsx';
import { ChevronLeftIcon } from '../../../components/admin/icons.jsx';
import { useSubmit } from '../../../hooks/useSubmit.js';
import { validateForm } from '../../../utils/validate-form.js';
import { RESTAURANT_AREA } from '../areas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { useRecoveryOptions } from '../hooks/useRecoveryOptions.js';
import { forgotPasswordSchema } from '../validators/password.schema.js';

const backLinkClass =
  'inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-admin-muted hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent';

/** Pedido do link de redefinição de senha por e-mail. */
export function ForgotPasswordPage({ area = RESTAURANT_AREA }) {
  const recovery = useRecoveryOptions(area);
  const { submitting, feedback, run } = useSubmit();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors } = validateForm(forgotPasswordSchema, { email });
    setError(errors?.email ?? null);
    if (!data) return;
    const ok = await run(() => area.account.requestPasswordReset(data.email));
    if (ok) setSent(true);
  }

  const backToLogin = (
    <Link to={area.loginPath} className={backLinkClass}>
      <ChevronLeftIcon size={16} />
      Voltar para o login
    </Link>
  );

  if (recovery && !recovery.emailRecovery) {
    return (
      <AuthLayout area={area} title="Recuperar acesso">
        <Alert tone="info" title="Recuperação por e-mail indisponível">
          {area.supportHint}
        </Alert>
        {backToLogin}
      </AuthLayout>
    );
  }

  if (sent) {
    return (
      <AuthLayout area={area} title="Verifique seu e-mail">
        <Alert tone="success" title="Pedido recebido">
          Se houver uma conta com o e-mail <strong className="font-semibold">{email.trim()}</strong>
          , você receberá um link para criar uma nova senha.
          {recovery?.linkTtlMinutes
            ? ` O link vale por ${recovery.linkTtlMinutes} minutos.`
            : ' O link vale por tempo limitado.'}
        </Alert>
        {recovery?.developmentMailLog && (
          <Alert tone="info">
            Ambiente de desenvolvimento: nenhum e-mail é enviado; o link aparece no terminal da API.
          </Alert>
        )}
        {backToLogin}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      area={area}
      title="Recuperar acesso"
      description="Informe o e-mail cadastrado. Enviaremos um link para você criar uma nova senha."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {feedback?.tone === 'error' && <Alert tone="danger">{feedback.message}</Alert>}
        <Field label="E-mail" error={error}>
          <TextInput
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" block loading={submitting}>
          Enviar link
        </Button>
      </form>
      {backToLogin}
    </AuthLayout>
  );
}
