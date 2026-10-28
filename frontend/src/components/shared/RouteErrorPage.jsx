import { useRouteError } from 'react-router';
import { StatusMessage } from '../ui/StatusMessage.jsx';

/** Exibida quando uma rota lança erro inesperado durante a renderização. */
export function RouteErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <main className="mx-auto max-w-xl">
      <StatusMessage
        tone="error"
        title="Algo deu errado"
        description="Recarregue a página para tentar novamente."
        action={{ label: 'Recarregar', onClick: () => window.location.reload() }}
      />
    </main>
  );
}
