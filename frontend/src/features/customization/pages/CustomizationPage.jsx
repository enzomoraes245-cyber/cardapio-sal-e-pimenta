import { useState } from 'react';
import { ConfirmDialog } from '../../../components/admin/Dialog.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useToast } from '../../../components/admin/Toast.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { CustomizationForm } from '../components/CustomizationForm.jsx';
import * as customizationService from '../services/customization.service.js';

/** Identidade visual (módulo Personalização): logotipo e cores do cardápio. */
export function CustomizationPage() {
  const toast = useToast();
  const { status, data, error, reload, setData } = useResource(
    customizationService.getCustomization,
  );
  const [restoring, setRestoring] = useState(false);

  async function handleSubmit({ colors, logo, removeLogo }) {
    let updated = await customizationService.updateCustomization(colors);
    if (logo) updated = await customizationService.replaceLogo(logo);
    else if (removeLogo) updated = await customizationService.removeLogo();
    setData(updated);
    toast.success('Identidade visual salva e publicada no cardápio.');
  }

  // Remonta o formulário com o estado salvo (descarta arquivo escolhido e marcações).
  const formKey = data && `${data.logoUrl}|${data.primaryColor}|${data.secondaryColor}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Identidade visual"
        description="Logotipo e cores aplicados somente ao cardápio do seu restaurante."
      />

      {status === 'loading' && <LoadingState label="Carregando identidade visual..." rows={3} />}
      {status === 'error' && (
        <ErrorState title="Não foi possível carregar" error={error} onRetry={reload} />
      )}
      {status === 'success' && (
        <CustomizationForm
          key={formKey}
          customization={data}
          onSubmit={handleSubmit}
          onRestoreDefaults={() => setRestoring(true)}
        />
      )}

      {restoring && (
        <ConfirmDialog
          title="Restaurar as cores padrão?"
          description="O cardápio volta às cores padrão da plataforma. O logotipo não muda."
          confirmLabel="Restaurar cores"
          tone="primary"
          onClose={() => setRestoring(false)}
          onConfirm={async () => {
            setData(
              await customizationService.updateCustomization({
                primaryColor: null,
                secondaryColor: null,
              }),
            );
            toast.success('Cores padrão restauradas.');
          }}
        />
      )}
    </div>
  );
}
