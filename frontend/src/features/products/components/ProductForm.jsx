import { useEffect, useRef, useState } from 'react';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Badge } from '../../../components/admin/Badge.jsx';
import { Button, LinkButton } from '../../../components/admin/Button.jsx';
import {
  AffixInput,
  Field,
  Select,
  Switch,
  Textarea,
  TextInput,
} from '../../../components/admin/Field.jsx';
import { FormSection } from '../../../components/admin/FormSection.jsx';
import { ImageInput } from '../../../components/admin/ImageInput.jsx';
import { formatMoneyInput } from '../../../utils/money-input.js';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { publicationStatus } from '../utils/publication.js';
import { productSchema } from '../validators/product.schema.js';

const LIMITS = { name: 120, shortDescription: 300, detailedDescription: 2000 };

function initialValues(product) {
  return {
    name: product?.name ?? '',
    price: formatMoneyInput(product?.price),
    categoryId: product?.category.id ?? '',
    shortDescription: product?.shortDescription ?? '',
    detailedDescription: product?.detailedDescription ?? '',
    image: null,
    removeImage: false,
    isActive: product?.isActive ?? true,
    isAvailable: product?.isAvailable ?? true,
  };
}

/** Contador de caracteres para campos com limite. */
function Counter({ value, max }) {
  return (
    <span className="text-xs text-admin-faint tabular-nums" aria-hidden="true">
      {value.length}/{max}
    </span>
  );
}

/**
 * Formulário de produto (cadastro e edição) em grupos: informações, preço e categoria, foto e
 * exibição. Mostra como o produto ficará no cardápio antes de salvar.
 * `onSubmit` recebe os valores validados (preço já como "12.50") e deve lançar erro se falhar.
 */
export function ProductForm({ product, categories, submitLabel, onSubmit }) {
  const formRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(product));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  const setField = (field, value) => setValues((previous) => ({ ...previous, [field]: value }));
  const bind = (field) => ({
    value: values[field],
    onChange: (event) => setField(field, event.target.value),
  });

  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const hasPhoto = Boolean(values.image) || (Boolean(product?.imageUrl) && !values.removeImage);
  const preview = publicationStatus({
    isActive: values.isActive,
    isAvailable: values.isAvailable,
    imageUrl: hasPhoto ? 'foto' : null,
    category: { isActive: selectedCategory?.isActive ?? true },
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const { data, errors: fieldErrors } = validateForm(productSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      setErrors(apiValidationErrors(error) ?? {});
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-admin-panel border border-admin-line bg-admin-surface"
    >
      <div className="px-5 py-8 sm:px-8">
        {formError && (
          <Alert tone="danger" title="Não foi possível salvar" className="mb-8">
            {formError}
          </Alert>
        )}

        <FormSection title="Informações" description="Nome e descrições exibidos para os clientes.">
          <Field
            label="Nome"
            error={errors.name}
            required
            action={<Counter value={values.name} max={LIMITS.name} />}
          >
            <TextInput maxLength={LIMITS.name} {...bind('name')} />
          </Field>
          <Field
            label="Descrição curta"
            hint="Aparece na lista do cardápio."
            error={errors.shortDescription}
            optional
            action={<Counter value={values.shortDescription} max={LIMITS.shortDescription} />}
          >
            <TextInput maxLength={LIMITS.shortDescription} {...bind('shortDescription')} />
          </Field>
          <Field
            label="Descrição detalhada"
            hint="Aparece ao abrir os detalhes do produto."
            error={errors.detailedDescription}
            optional
            action={<Counter value={values.detailedDescription} max={LIMITS.detailedDescription} />}
          >
            <Textarea
              rows={4}
              maxLength={LIMITS.detailedDescription}
              {...bind('detailedDescription')}
            />
          </Field>
        </FormSection>

        <FormSection title="Preço e categoria">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Preço" hint="Ex.: 24,90" error={errors.price} required>
              <AffixInput prefix="R$" inputMode="decimal" {...bind('price')} />
            </Field>
            <Field
              label="Categoria"
              error={errors.categoryId}
              required
              hint={
                selectedCategory && !selectedCategory.isActive
                  ? 'Esta categoria está oculta: o produto não aparece no cardápio enquanto ela estiver oculta.'
                  : undefined
              }
            >
              <Select {...bind('categoryId')}>
                <option value="">Selecione...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isActive ? '' : ' (oculta)'}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Foto"
          description="Opcional. Sem foto, o produto fica salvo, mas só aparece no cardápio quando receber uma."
        >
          <ImageInput
            label="Fotografia do produto"
            currentUrl={values.removeImage ? null : product?.imageUrl}
            value={values.image}
            onChange={(file) => {
              setField('image', file);
              if (file) setField('removeImage', false);
            }}
            onRemove={product?.imageUrl ? () => setField('removeImage', true) : undefined}
            removeLabel="Remover foto"
            error={errors.image}
            previewClassName="size-36"
          />
          {values.removeImage && (
            <Alert
              tone="warning"
              action={
                <Button variant="ghost" size="sm" onClick={() => setField('removeImage', false)}>
                  Desfazer
                </Button>
              }
            >
              A foto atual será removida ao salvar.
            </Alert>
          )}
        </FormSection>

        <FormSection
          title="Exibição"
          description="Controla se o produto aparece para os clientes, sem apagar nada."
        >
          <Switch
            label="Ativo"
            description="Inativo nunca aparece no cardápio."
            checked={values.isActive}
            onChange={(checked) => setField('isActive', checked)}
          />
          <Switch
            label="Disponível"
            description="Desligue quando o item acabar; ele volta a aparecer quando você religar."
            checked={values.isAvailable}
            onChange={(checked) => setField('isAvailable', checked)}
          />
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-admin-muted">
            Ao salvar:
            <Badge tone={preview.tone}>
              {preview.published ? 'Aparece no cardápio' : `Fora do cardápio · ${preview.label}`}
            </Badge>
          </p>
        </FormSection>
      </div>

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 rounded-b-admin-panel border-t border-admin-line bg-admin-subtle/95 px-5 py-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-8">
        <LinkButton to="/admin/produtos" variant="secondary">
          Cancelar
        </LinkButton>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
