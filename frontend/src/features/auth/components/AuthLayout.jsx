import { Wordmark } from '../../../components/admin/Brand.jsx';

/**
 * Moldura das telas sem sessão (login, recuperação e redefinição de senha, acesso suspenso):
 * painel da marca à esquerda em telas largas e o conteúdo à direita.
 */
export function AuthLayout({ area, title, description, children }) {
  return (
    <div className="grid min-h-dvh bg-admin-canvas font-admin text-admin-text antialiased lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden bg-admin-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
        <Wordmark environment={area.environment} tone="light" />
        <div className="max-w-md space-y-5">
          <p className="font-admin-display text-[42px] leading-[1.08] font-semibold tracking-[-0.02em] text-white">
            {area.headline}
          </p>
          <p className="text-[15px] leading-relaxed text-admin-sidebar-muted">{area.subline}</p>
        </div>
        <p className="text-xs tracking-[0.14em] text-admin-sidebar-muted/80 uppercase">
          {area.environmentLong}
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px] space-y-8">
          <Wordmark environment={area.environment} className="lg:hidden" />
          <div className="space-y-2">
            <h1 className="font-admin-display text-[30px] leading-tight font-semibold tracking-[-0.015em]">
              {title}
            </h1>
            {description && (
              <p className="text-sm leading-relaxed text-admin-muted">{description}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
