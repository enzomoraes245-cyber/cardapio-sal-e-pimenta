import { useEffect, useId, useRef, useState } from 'react';
import { Alert } from './Alert.jsx';
import { Button, IconButton } from './Button.jsx';
import { cx } from './cx.js';
import { Field, Textarea } from './Field.jsx';
import { XIcon } from './icons.jsx';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Abre o <dialog> nativo ao montar e devolve o foco ao elemento de origem ao desmontar. */
function useModalDialog(ref) {
  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [ref]);
}

/**
 * Janela modal com <dialog> nativo: foco preso, Esc e clique no fundo fecham (quando
 * `dismissible`). Deve ser montada só enquanto estiver aberta.
 */
export function Dialog({
  title,
  description,
  footer,
  onClose,
  size = 'md',
  dismissible = true,
  children,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useModalDialog(ref);

  function handleCancel(event) {
    event.preventDefault();
    if (dismissible) onClose();
  }

  function handleClick(event) {
    if (dismissible && event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
      className={cx(
        'm-auto w-[calc(100%-2rem)] overflow-visible bg-transparent p-0 font-admin text-admin-text backdrop:bg-admin-sidebar/50',
        SIZES[size],
      )}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col rounded-admin-dialog bg-admin-surface shadow-admin-float">
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg leading-snug font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm leading-relaxed text-admin-muted">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton
              label="Fechar"
              icon={XIcon}
              size="sm"
              onClick={onClose}
              className="-mt-1 -mr-2"
            />
          )}
        </header>
        <div className="overflow-y-auto px-6 pb-5">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-2 rounded-b-admin-dialog border-t border-admin-line bg-admin-subtle px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

/**
 * Confirmação de ação relevante. Com `reason`, pede o motivo (obrigatório quando
 * `reason.required`). `onConfirm(motivo)` pode lançar erro: a mensagem aparece na própria janela
 * e o texto digitado é mantido. Em caso de sucesso a janela fecha (onClose).
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  reason,
  onConfirm,
  onClose,
  children,
}) {
  const formId = useId();
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const trimmed = text.trim();
    if (reason?.required && !trimmed) {
      setFieldError(reason.requiredMessage ?? 'Informe o motivo.');
      return;
    }
    setFieldError(null);
    setError(null);
    setBusy(true);
    try {
      await onConfirm(trimmed || undefined);
    } catch (submitError) {
      setError(submitError);
      setBusy(false);
      return;
    }
    onClose();
  }

  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      dismissible={!busy}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        {children}
        {reason && (
          <Field
            label={reason.label}
            hint={reason.hint}
            error={fieldError}
            required={reason.required}
            optional={!reason.required}
          >
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={reason.maxLength ?? 300}
              placeholder={reason.placeholder}
              rows={3}
            />
          </Field>
        )}
        {error && <Alert tone="danger">{error.message}</Alert>}
      </form>
    </Dialog>
  );
}

/** Painel lateral (navegação no celular), também com <dialog> nativo. */
export function Drawer({ label, onClose, children }) {
  const ref = useRef(null);
  useModalDialog(ref);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleClick(event) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={handleCancel}
      onClick={handleClick}
      className="m-0 h-dvh max-h-none w-[min(20rem,calc(100%-3rem))] max-w-none bg-transparent p-0 font-admin backdrop:bg-admin-sidebar/50"
    >
      {children}
    </dialog>
  );
}
