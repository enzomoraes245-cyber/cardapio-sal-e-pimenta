import { useState } from 'react';
import { z } from 'zod';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Badge } from '../../../../components/admin/Badge.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { ConfirmDialog, Dialog } from '../../../../components/admin/Dialog.jsx';
import { Field, TextInput } from '../../../../components/admin/Field.jsx';
import {
  KeyIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  UnlockIcon,
} from '../../../../components/admin/icons.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { PasswordInput } from '../../../../components/admin/PasswordInput.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { formatDayOf } from '../../../../utils/format-date.js';
import { apiValidationErrors, validateForm } from '../../../../utils/validate-form.js';
import {
  blockAdmin,
  createAdmin,
  resetAdminPassword,
  unblockAdmin,
  updateAdmin,
} from '../services/platform-restaurants.service.js';
import {
  adminProfileSchema,
  adminSchema,
  passwordSchema,
} from '../validators/restaurant.schema.js';

const resetSchema = z.object({ password: passwordSchema });

/** Formulário em janela: cadastro, edição ou redefinição de senha de um responsável. */
function AdminFormDialog({
  title,
  description,
  fields,
  schema,
  initial,
  submitLabel,
  onSubmit,
  onClose,
}) {
  const formId = `form-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const { submitting, feedback, run } = useSubmit();

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors: fieldErrors } = validateForm(schema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;
    const ok = await run(async () => {
      try {
        await onSubmit(data);
      } catch (error) {
        setErrors(apiValidationErrors(error) ?? {});
        throw error;
      }
    });
    if (ok) onClose();
  }

  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      dismissible={!submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {feedback?.tone === 'error' && !Object.keys(errors).length && (
          <Alert tone="danger">{feedback.message}</Alert>
        )}
        {fields.map(({ name, label, type = 'text', hint, autoComplete }) => (
          <Field key={name} label={label} hint={hint} error={errors[name]} required>
            {type === 'password' ? (
              <PasswordInput
                autoComplete={autoComplete ?? 'new-password'}
                value={values[name]}
                onChange={(event) => setValues({ ...values, [name]: event.target.value })}
              />
            ) : (
              <TextInput
                type={type}
                autoComplete={autoComplete ?? 'off'}
                value={values[name]}
                onChange={(event) => setValues({ ...values, [name]: event.target.value })}
              />
            )}
          </Field>
        ))}
      </form>
    </Dialog>
  );
}

const NAME_FIELD = { name: 'name', label: 'Nome' };
const EMAIL_FIELD = { name: 'email', label: 'E-mail de acesso', type: 'email' };
const PASSWORD_FIELD = {
  name: 'password',
  label: 'Senha',
  type: 'password',
  hint: 'Ao menos 8 caracteres. Informe a senha ao responsável por um canal seguro.',
};

/**
 * Responsáveis com acesso ao painel do restaurante: cadastrar, editar, bloquear/liberar e
 * redefinir senha. Bloquear encerra as sessões abertas; nada é apagado.
 */
export function AdminsPanel({ restaurant, onAdminsChanged }) {
  const toast = useToast();
  const [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);

  function replaceAdmin(updated) {
    onAdminsChanged(restaurant.admins.map((admin) => (admin.id === updated.id ? updated : admin)));
  }

  return (
    <Panel
      title="Responsáveis"
      description="Pessoas com acesso ao painel deste restaurante."
      actions={
        <Button size="sm" icon={PlusIcon} onClick={() => setDialog({ type: 'create' })}>
          Adicionar responsável
        </Button>
      }
      flush
    >
      <ul className="divide-y divide-admin-line">
        {restaurant.admins.map((admin) => (
          <li
            key={admin.id}
            className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-neutral-soft text-sm font-semibold text-admin-neutral"
              >
                {admin.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2 font-medium text-admin-text">
                  {admin.name}
                  {admin.blocked ? (
                    <Badge tone="danger" icon={LockIcon}>
                      Acesso bloqueado
                    </Badge>
                  ) : (
                    <Badge tone="success">Acesso liberado</Badge>
                  )}
                </p>
                <p className="truncate text-sm text-admin-muted">{admin.email}</p>
                <p className="text-xs text-admin-faint">
                  Cadastrado em {formatDayOf(admin.createdAt)}
                  {admin.blocked && ` · bloqueado em ${formatDayOf(admin.disabledAt)}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="secondary"
                size="sm"
                icon={PencilIcon}
                aria-label={`Editar ${admin.name}`}
                onClick={() => setDialog({ type: 'edit', admin })}
              >
                Editar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={KeyIcon}
                aria-label={`Redefinir a senha de ${admin.name}`}
                onClick={() => setDialog({ type: 'password', admin })}
              >
                Redefinir senha
              </Button>
              {admin.blocked ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={UnlockIcon}
                  aria-label={`Liberar o acesso de ${admin.name}`}
                  onClick={() => setDialog({ type: 'unblock', admin })}
                >
                  Liberar acesso
                </Button>
              ) : (
                <Button
                  variant="danger-outline"
                  size="sm"
                  icon={LockIcon}
                  aria-label={`Bloquear o acesso de ${admin.name}`}
                  onClick={() => setDialog({ type: 'block', admin })}
                >
                  Bloquear acesso
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {dialog?.type === 'create' && (
        <AdminFormDialog
          title="Adicionar responsável"
          description="A pessoa entra no painel deste restaurante com o e-mail e a senha informados."
          fields={[NAME_FIELD, EMAIL_FIELD, PASSWORD_FIELD]}
          schema={adminSchema}
          initial={{ name: '', email: '', password: '' }}
          submitLabel="Adicionar"
          onClose={close}
          onSubmit={async (data) => {
            const created = await createAdmin(restaurant.id, data);
            onAdminsChanged([...restaurant.admins, created]);
            toast.success(`${created.name} pode entrar no painel.`);
          }}
        />
      )}
      {dialog?.type === 'edit' && (
        <AdminFormDialog
          title="Editar responsável"
          fields={[NAME_FIELD, EMAIL_FIELD]}
          schema={adminProfileSchema}
          initial={{ name: dialog.admin.name, email: dialog.admin.email }}
          submitLabel="Salvar"
          onClose={close}
          onSubmit={async (data) => {
            replaceAdmin(await updateAdmin(restaurant.id, dialog.admin.id, data));
            toast.success('Responsável atualizado.');
          }}
        />
      )}
      {dialog?.type === 'password' && (
        <AdminFormDialog
          title="Redefinir senha"
          description={`Define uma nova senha para ${dialog.admin.name} e encerra as sessões abertas.`}
          fields={[{ ...PASSWORD_FIELD, label: 'Nova senha' }]}
          schema={resetSchema}
          initial={{ password: '' }}
          submitLabel="Redefinir senha"
          onClose={close}
          onSubmit={async ({ password }) => {
            await resetAdminPassword(restaurant.id, dialog.admin.id, password);
            onAdminsChanged(restaurant.admins);
            toast.success('Senha redefinida. As sessões abertas foram encerradas.');
          }}
        />
      )}
      {dialog?.type === 'block' && (
        <ConfirmDialog
          title={`Bloquear o acesso de ${dialog.admin.name}?`}
          description="A pessoa sai do painel na hora e não consegue entrar até o acesso ser liberado. Nada é apagado."
          confirmLabel="Bloquear acesso"
          reason={{ label: 'Motivo', placeholder: 'Ex.: deixou de trabalhar no restaurante' }}
          onClose={close}
          onConfirm={async (reason) => {
            replaceAdmin(await blockAdmin(restaurant.id, dialog.admin.id, reason));
            toast.success('Acesso bloqueado.');
          }}
        />
      )}
      {dialog?.type === 'unblock' && (
        <ConfirmDialog
          title={`Liberar o acesso de ${dialog.admin.name}?`}
          description="A pessoa volta a entrar no painel com a senha atual."
          confirmLabel="Liberar acesso"
          tone="primary"
          reason={{ label: 'Motivo' }}
          onClose={close}
          onConfirm={async (reason) => {
            replaceAdmin(await unblockAdmin(restaurant.id, dialog.admin.id, reason));
            toast.success('Acesso liberado.');
          }}
        />
      )}
    </Panel>
  );
}
