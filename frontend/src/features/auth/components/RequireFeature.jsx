import { Outlet } from 'react-router';
import { LinkButton } from '../../../components/admin/Button.jsx';
import { LockIcon } from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { EmptyState } from '../../../components/admin/States.jsx';
import { useSession } from '../hooks/useSession.js';

/**
 * Páginas de módulos que o backoffice pode bloquear (DEC-006). Com o módulo bloqueado, a página
 * explica a situação em vez de falhar (o menu já esconde o item; aqui cobre o acesso pelo link).
 * `standalone` é para páginas fora do layout do painel (ex.: folha de impressão).
 */
export function RequireFeature({ feature, title, standalone = false }) {
  const { features } = useSession();
  if (features?.[feature] !== false) return <Outlet />;

  const locked = (
    <div className="space-y-8">
      <PageHeader title={title} />
      <EmptyState
        icon={LockIcon}
        title="Módulo não liberado"
        description={`O módulo ${title} não está liberado para este restaurante. Para ativá-lo, fale com o suporte da plataforma.`}
        action={
          <LinkButton to="/admin" variant="secondary">
            Voltar ao início
          </LinkButton>
        }
      />
    </div>
  );
  if (!standalone) return locked;
  return (
    <div className="min-h-dvh bg-admin-canvas px-4 py-10 font-admin text-admin-text antialiased sm:px-8">
      <main className="mx-auto max-w-3xl">{locked}</main>
    </div>
  );
}
