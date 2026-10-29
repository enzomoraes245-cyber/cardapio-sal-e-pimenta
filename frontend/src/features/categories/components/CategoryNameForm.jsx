import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField, INPUT_CLASS } from '../../../components/ui/FormField.jsx';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { categorySchema } from '../validators/category.schema.js';

/**
 * Formulário de nome de categoria, usado para criar e para renomear.
 * `onSubmit` recebe { name } validado e deve lançar erro em caso de falha.
 */
export function CategoryNameForm({ initialName = '', submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const { data, errors } = validateForm(categorySchema, { name });
    if (!data) return setError(errors.name);

    setSubmitting(true);
    try {
      await onSubmit(data);
      setError(null);
      if (!initialName) setName('');
    } catch (submitError) {
      setError(apiValidationErrors(submitError)?.name ?? submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <FormField label={initialName ? 'Novo nome' : 'Nome da categoria'} error={error}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className={INPUT_CLASS}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando...' : submitLabel}
      </Button>
      {onCancel && (
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </form>
  );
}
