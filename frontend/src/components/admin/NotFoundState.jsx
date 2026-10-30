import { LinkButton } from './Button.jsx';
import { SearchIcon } from './icons.jsx';
import { PageHeader } from './PageHeader.jsx';
import { EmptyState } from './States.jsx';

/** Endereço inexistente dentro de uma área administrativa (sem <main> próprio). */
export function NotFoundState({ homePath }) {
  return (
    <div className="space-y-8">
      <PageHeader title="Página não encontrada" />
      <EmptyState
        icon={SearchIcon}
        title="Não encontramos esta página"
        description="Confira o endereço ou volte ao início."
        action={
          <LinkButton to={homePath} variant="secondary">
            Voltar ao início
          </LinkButton>
        }
      />
    </div>
  );
}
