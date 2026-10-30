import { useState } from 'react';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, TextInput } from '../../../components/admin/Field.jsx';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { categorySchema } from '../validators/category.schema.js';

/**
 * Nome de categoria (cadastro ou renomeação). `onSubmit` recebe { name } validado e deve lançar
 * erro se falhar; o texto digitado é mantido em caso de erro.
 */
export function CategoryNameForm({
  label = 'Nome da categoria',
  initialName = '',
  submitLabel,
  onSubmit,
  onCancel,
  disabled = false,
  hideLabel = false,
  autoFocus = false,
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const { data, errors } = validateForm(categorySchema, { name });
    setError(errors?.name ?? null);
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit(data);
      if (!initialName) setName('');
    } catch (submitError) {
      setError(apiValidationErrors(submitError)?.name ?? submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <Field label={label} error={error} hideLabel={hideLabel} className="flex-1">
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="Ex.: Pratos principais"
          disabled={disabled}
          // Usado só na renomeação, que o próprio usuário acabou de abrir.
          autoFocus={autoFocus}
        />
      </Field>
      <div className={hideLabel ? 'flex gap-2' : 'flex gap-2 sm:pt-[26px]'}>
        <Button type="submit" loading={submitting} disabled={disabled}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
