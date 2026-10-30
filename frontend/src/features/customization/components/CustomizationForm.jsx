import { useState } from 'react';
import { Button } from '../../../components/admin/Button.jsx';
import { Field, inputClass } from '../../../components/admin/Field.jsx';
import { ImageInput } from '../../../components/admin/ImageInput.jsx';
import { apiValidationErrors, validateForm } from '../../../utils/validate-form.js';
import { CategoryTabs } from '../../menu/components/CategoryTabs.jsx';
import { MenuHeader } from '../../menu/components/MenuHeader.jsx';
import { ProductList } from '../../menu/components/ProductList.jsx';
import { getBrandStyle } from '../utils/brand-style.js';
import { customizationSchema } from '../validators/customization.schema.js';
import { ColorField } from './ColorField.jsx';

// Cores sugeridas quando o restaurante ainda não personalizou.
const DEFAULT_PRIMARY = '#9a3412';
const DEFAULT_SECONDARY = '#fafaf9';

// Conteúdo fictício da prévia do cardápio.
const PREVIEW_CATEGORIES = [
  { id: 'previa-1', name: 'Pratos' },
  { id: 'previa-2', name: 'Bebidas' },
];
// Foto neutra embutida (SVG), para a prévia não depender de arquivos do restaurante.
const PREVIEW_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#e7e2da"/></svg>',
  );
const PREVIEW_PRODUCT = {
  id: 'previa-produto',
  name: 'Produto de exemplo',
  shortDescription: 'Descrição curta do prato.',
  price: '24.90',
  imageUrl: PREVIEW_IMAGE,
};

/** Nome, cores e logotipo, com prévia do cabeçalho do cardápio. */
export function CustomizationForm({ customization, onSubmit }) {
  const [values, setValues] = useState({
    name: customization.name,
    primaryColor: customization.primaryColor ?? DEFAULT_PRIMARY,
    secondaryColor: customization.secondaryColor ?? DEFAULT_SECONDARY,
    logo: null,
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const setField = (field) => (value) => setValues((previous) => ({ ...previous, [field]: value }));

  const [previewLogoUrl, setPreviewLogoUrl] = useState(null);
  const preview = {
    name: values.name || customization.name,
    logoUrl: previewLogoUrl ?? customization.logoUrl,
    primaryColor: values.primaryColor,
    secondaryColor: values.secondaryColor,
  };

  function handleLogoChange(file) {
    setField('logo')(file);
    setPreviewLogoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);
    const { logo, ...fields } = values;
    const { data, errors: fieldErrors } = validateForm(customizationSchema, fields);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...data, logo });
      setFeedback({ tone: 'success', message: 'Personalização salva e publicada.' });
    } catch (error) {
      setErrors(apiValidationErrors(error) ?? {});
      setFeedback({ tone: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <Field label="Nome do restaurante" error={errors.name}>
          <input
            value={values.name}
            onChange={(event) => setField('name')(event.target.value)}
            maxLength={120}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <ColorField
            label="Cor principal"
            hint="Cabeçalho, botões e destaques."
            value={values.primaryColor}
            onChange={setField('primaryColor')}
            error={errors.primaryColor}
          />
          <ColorField
            label="Cor de fundo"
            hint="Fundo da página do cardápio."
            value={values.secondaryColor}
            onChange={setField('secondaryColor')}
            error={errors.secondaryColor}
          />
        </div>
        <ImageInput
          label="Logotipo"
          currentUrl={customization.logoUrl}
          value={values.logo}
          onChange={handleLogoChange}
          previewClassName="size-24"
        />

        {feedback && (
          <p
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-lg px-3 py-2 text-sm ${
              feedback.tone === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {feedback.message}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar e publicar'}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">Prévia</p>
        {/* Mesmos componentes do cardápio público, sem interação (inert). */}
        <div
          style={getBrandStyle(preview)}
          className="overflow-hidden rounded-xl border border-slate-200 bg-brand-soft font-menu text-ink"
          aria-hidden="true"
          inert
        >
          <MenuHeader restaurant={preview} />
          <div className="space-y-4 px-5 pt-3 pb-5">
            <CategoryTabs
              categories={PREVIEW_CATEGORIES}
              selectedId={PREVIEW_CATEGORIES[0].id}
              onSelect={() => {}}
            />
            <ProductList
              categories={[{ ...PREVIEW_CATEGORIES[0], products: [PREVIEW_PRODUCT] }]}
              onSelectProduct={() => {}}
              favorites={new Set()}
              onToggleFavorite={() => {}}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          A cor do texto é ajustada automaticamente para manter a leitura.
        </p>
      </div>
    </form>
  );
}
