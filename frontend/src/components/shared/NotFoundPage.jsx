import { StatusMessage } from '../ui/StatusMessage.jsx';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl">
      <StatusMessage title="Página não encontrada" description="Verifique o endereço acessado." />
    </main>
  );
}
