import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { useSession } from '../../auth/hooks/useSession.js';
import { CustomizationForm } from '../components/CustomizationForm.jsx';
import * as customizationService from '../services/customization.service.js';

export function CustomizationPage() {
  const { refresh: refreshSession } = useSession();
  const { status, data, error, reload, setData } = useResource(
    customizationService.getCustomization,
  );

  async function handleSubmit({ logo, ...fields }) {
    let updated = await customizationService.updateCustomization(fields);
    if (logo) updated = await customizationService.replaceLogo(logo);
    setData(updated);
    // Atualiza o nome do restaurante exibido no cabeçalho da retaguarda.
    refreshSession();
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Personalização</h1>
        <p className="mt-1 text-slate-600">
          Nome, logotipo e cores aplicados somente ao cardápio do seu restaurante.
        </p>
      </div>

      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar a personalização"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && <CustomizationForm customization={data} onSubmit={handleSubmit} />}
    </section>
  );
}
