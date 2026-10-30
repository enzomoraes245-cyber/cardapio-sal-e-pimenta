import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, inputClass } from '../../../components/admin/Field.jsx';
import { ImageInput } from '../../../components/admin/ImageInput.jsx';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { formatMoneyInput } from '../../../utils/money-input.js';
import { productSchema } from '../validators/product.schema.js';

function initialValues(product) {
  return {
    name: product?.name ?? '',
    price: formatMoneyInput(product?.price),
    categoryId: product?.category.id ?? '',
    shortDescription: product?.shortDescription ?? '',
    detailedDescription: product?.detailedDescription ?? '',
    image: null,
    isActive: product?.isActive ?? true,
    isAvailable: product?.isAvailable ?? true,
  };
}

/**
 * Formulário de produto (cadastro e edição).
 * `onSubmit` recebe os valores validados (preço já como "12.50") e deve lançar erro se falhar.
 */
export function ProductForm({ product, categories, submitLabel, onSubmit }) {
  const isEdit = Boolean(product);
  const [values, setValues] = useState(() => initialValues(product));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => setValues((previous) => ({ ...previous, [field]: value }));
  const bindInput = (field) => ({
    value: values[field],
    onChange: (event) => setField(field, event.target.value),
  });
  const bindCheckbox = (field) => ({
    checked: values[field],
    onChange: (event) => setField(field, event.target.checked),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const { data, errors: fieldErrors } = validateForm(
      productSchema({ requireImage: !isEdit }),
      values,
    );
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      const apiErrors = apiValidationErrors(error);
      if (apiErrors) setErrors(apiErrors);
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="space-y-5">
          <Field label="Nome *" error={errors.name}>
            <input maxLength={120} className={inputClass} {...bindInput('name')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Preço (R$) *" hint="Ex.: 24,90" error={errors.price}>
              <input inputMode="decimal" className={inputClass} {...bindInput('price')} />
            </Field>
            <Field label="Categoria *" error={errors.categoryId}>
              <select className={inputClass} {...bindInput('categoryId')}>
                <option value="">Selecione...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Descrição curta"
            hint="Aparece na listagem do cardápio."
            error={errors.shortDescription}
          >
            <input maxLength={300} className={inputClass} {...bindInput('shortDescription')} />
          </Field>

          <Field
            label="Descrição detalhada"
            hint="Aparece ao abrir os detalhes do produto."
            error={errors.detailedDescription}
          >
            <textarea
              rows={4}
              maxLength={2000}
              className={inputClass}
              {...bindInput('detailedDescription')}
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">Situação</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...bindCheckbox('isActive')} /> Ativo
              <span className="text-slate-500">(inativo nunca aparece no cardápio)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...bindCheckbox('isAvailable')} /> Disponível
              <span className="text-slate-500">(desmarque quando o item acabar)</span>
            </label>
          </fieldset>
        </div>

        <ImageInput
          label={isEdit ? 'Fotografia (envie outra para substituir)' : 'Fotografia *'}
          currentUrl={product?.imageUrl}
          value={values.image}
          onChange={(file) => setField('image', file)}
          error={errors.image}
          previewClassName="aspect-square w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : submitLabel}
        </Button>
        <Link
          to="/admin/produtos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
