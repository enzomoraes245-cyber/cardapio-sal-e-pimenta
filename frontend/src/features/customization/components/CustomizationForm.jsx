import { useEffect, useState } from 'react';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button } from '../../../components/admin/Button.jsx';
import { FormSection } from '../../../components/admin/FormSection.jsx';
import { ImageInput } from '../../../components/admin/ImageInput.jsx';
import { RefreshIcon } from '../../../components/admin/icons.jsx';
import { validateForm } from '../../../utils/validate-form.js';
import { CategoryTabs } from '../../menu/components/CategoryTabs.jsx';
import { MenuHeader } from '../../menu/components/MenuHeader.jsx';
import { ProductList } from '../../menu/components/ProductList.jsx';
import { getBrandStyle } from '../utils/brand-style.js';
import { contrastWarnings } from '../utils/contrast-warnings.js';
import { customizationSchema } from '../validators/customization.schema.js';
import { ColorField } from './ColorField.jsx';

// Cores padrão do cardápio (as mesmas do tema), usadas quando o restaurante não personalizou.
const DEFAULT_PRIMARY = '#9a3412';
const DEFAULT_SECONDARY = '#fafaf9';

// Conteúdo ilustrativo da prévia do cardápio.
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

/** URL temporária do logotipo escolhido, para a prévia; liberada ao trocar ou sair. */
function useLogoPreview(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

/**
 * Logotipo e cores, com prévia feita com os mesmos componentes do cardápio público.
 * `onSubmit({ colors, logo, removeLogo })` deve lançar erro se falhar. Depois de salvar, quem usa
 * remonta o formulário (key), que volta ao estado salvo sem reenviar o logotipo.
 */
export function CustomizationForm({ customization, onSubmit, onRestoreDefaults }) {
  const [values, setValues] = useState({
    primaryColor: customization.primaryColor ?? DEFAULT_PRIMARY,
    secondaryColor: customization.secondaryColor ?? DEFAULT_SECONDARY,
    logo: null,
    removeLogo: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const setField = (field) => (value) => setValues((previous) => ({ ...previous, [field]: value }));
  const logoPreviewUrl = useLogoPreview(values.logo);
  const warnings = contrastWarnings(values);

  const preview = {
    name: customization.name,
    logoUrl: values.removeLogo ? null : (logoPreviewUrl ?? customization.logoUrl),
    primaryColor: values.primaryColor,
    secondaryColor: values.secondaryColor,
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const { data, errors: fieldErrors } = validateForm(customizationSchema, values);
    setErrors(fieldErrors ?? {});
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit({ colors: data, logo: values.logo, removeLogo: values.removeLogo });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <form
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

          <FormSection
            title="Logotipo"
            description="Aparece acima do nome no topo do cardápio. Sem logotipo, o cardápio mostra só o nome."
          >
            <ImageInput
              label="Arquivo do logotipo"
              currentUrl={values.removeLogo ? null : customization.logoUrl}
              value={values.logo}
              onChange={(file) => {
                setField('logo')(file);
                if (file) setField('removeLogo')(false);
              }}
              onRemove={customization.logoUrl ? () => setField('removeLogo')(true) : undefined}
              removeLabel="Remover logotipo"
              emptyLabel="Sem logotipo"
              previewClassName="size-28"
            />
            {values.removeLogo && (
              <Alert
                tone="warning"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setField('removeLogo')(false)}>
                    Desfazer
                  </Button>
                }
              >
                O logotipo atual será removido ao salvar.
              </Alert>
            )}
          </FormSection>

          <FormSection
            title="Cores"
            description="Os textos do cardápio são escuros: use um fundo claro para manter a leitura."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ColorField
                label="Cor de destaque"
                hint="Destaca a última palavra do nome e os favoritos marcados."
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
            {(warnings.primaryColor || warnings.secondaryColor) && (
              <Alert tone="warning" title="Atenção à leitura">
                {[warnings.secondaryColor, warnings.primaryColor].filter(Boolean).join(' ')}
              </Alert>
            )}
          </FormSection>
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-b-admin-panel border-t border-admin-line bg-admin-subtle px-5 py-4 sm:flex-row sm:justify-between sm:px-8">
          <Button
            variant="ghost"
            icon={RefreshIcon}
            onClick={onRestoreDefaults}
            disabled={submitting}
          >
            Restaurar cores padrão
          </Button>
          <Button type="submit" loading={submitting}>
            Salvar e publicar
          </Button>
        </div>
      </form>

      <div className="space-y-3 xl:sticky xl:top-8 xl:self-start">
        <p className="text-sm font-medium text-admin-text">Prévia do cardápio</p>
        {/* Mesmos componentes do cardápio público, sem interação (inert). */}
        <div
          style={getBrandStyle(preview)}
          className="overflow-hidden rounded-admin-panel border border-admin-line bg-brand-soft font-menu text-ink shadow-admin-raise"
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
        <p className="text-xs leading-relaxed text-admin-faint">
          Ilustração com conteúdo de exemplo. O nome vem de Dados do estabelecimento.
        </p>
      </div>
    </div>
  );
}
