import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Wordmark } from '../components/admin/Brand.jsx';
import { IconButton } from '../components/admin/Button.jsx';
import { cx } from '../components/admin/cx.js';
import { Drawer } from '../components/admin/Dialog.jsx';
import { ErrorBoundary } from '../components/admin/ErrorBoundary.jsx';
import {
  ExternalLinkIcon,
  LogoutIcon,
  MenuIcon,
  UserIcon,
  XIcon,
} from '../components/admin/icons.jsx';
import { PAGE_TITLE_ID } from '../components/admin/PageHeader.jsx';

const SIDEBAR_WIDTH = 'w-[264px]';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase() || '?';
}

const itemBase =
  'group relative flex items-center gap-3 rounded-admin-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70';

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cx(
          itemBase,
          'text-admin-sidebar-text/85 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <Icon size={18} className="shrink-0 text-admin-sidebar-muted group-hover:text-white" />
        <span className="flex-1">{item.label}</span>
        <ExternalLinkIcon size={14} className="text-admin-sidebar-muted" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          itemBase,
          isActive
            ? 'bg-white/[0.08] text-white before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-admin-accent-bright'
            : 'text-admin-sidebar-text/85 hover:bg-white/[0.05] hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={cx(
              'shrink-0',
              isActive
                ? 'text-admin-accent-bright'
                : 'text-admin-sidebar-muted group-hover:text-white',
            )}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function Sidebar({
  environment,
  homePath,
  context,
  navigation,
  user,
  accountPath,
  onLogout,
  onNavigate,
}) {
  const footerItem =
    'flex items-center justify-center gap-2 rounded-admin-control px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70';
  return (
    <div className="flex h-full flex-col bg-admin-sidebar text-admin-sidebar-text">
      <div className="px-5 pt-6 pb-5">
        <Link
          to={homePath}
          onClick={onNavigate}
          className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          <Wordmark environment={environment} tone="light" />
        </Link>
      </div>

      {context && (
        <div className="mx-3 mb-5 rounded-admin-panel border border-white/[0.08] bg-white/[0.03] px-3 py-3">
          {context}
        </div>
      )}

      <nav aria-label="Navegação principal" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navigation.map((group, index) => (
          <div key={group.label ?? index} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.14em] text-admin-sidebar-muted uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to ?? item.href}>
                  <NavItem item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold text-white"
          >
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-admin-sidebar-muted">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <NavLink
            to={accountPath}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                footerItem,
                'flex-1',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-admin-sidebar-text/85 hover:bg-white/[0.06] hover:text-white',
              )
            }
          >
            <UserIcon size={16} />
            Minha conta
          </NavLink>
          <button
            type="button"
            onClick={onLogout}
            className={cx(
              footerItem,
              'text-admin-sidebar-text/85 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            <LogoutIcon size={16} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Estrutura das áreas administrativas: barra lateral fixa em telas ≥ 1024 px e, abaixo disso,
 * barra superior com menu em gaveta. Oferece "Ir para o conteúdo" e, a cada navegação, leva o
 * foco ao título da nova página (leitores de tela anunciam a troca).
 *
 * `navigation`: [{ label?, items: [{ to | href, label, icon, end? }] }].
 */
export function AdminShell(props) {
  const { environment, homePath } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    const frame = requestAnimationFrame(() => document.getElementById(PAGE_TITLE_ID)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-dvh bg-admin-canvas font-admin text-admin-text antialiased">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-admin-control focus:bg-admin-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-admin-float focus:outline-2 focus:outline-admin-accent"
      >
        Ir para o conteúdo
      </a>

      <aside className={cx('fixed inset-y-0 left-0 z-30 hidden lg:block', SIDEBAR_WIDTH)}>
        <Sidebar {...props} />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-admin-line bg-admin-surface/95 px-3 backdrop-blur-sm sm:px-5 lg:hidden">
        <IconButton
          label="Abrir menu"
          icon={MenuIcon}
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
        />
        <Link
          to={homePath}
          className="min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-admin-accent"
        >
          <Wordmark environment={environment} />
        </Link>
      </header>

      {drawerOpen && (
        <Drawer label="Menu" onClose={closeDrawer}>
          <div className="relative h-full">
            <Sidebar {...props} onNavigate={closeDrawer} />
            <IconButton
              label="Fechar menu"
              icon={XIcon}
              onClick={closeDrawer}
              className="absolute top-5 right-3 text-admin-sidebar-muted hover:bg-white/10 hover:text-white"
            />
          </div>
        </Drawer>
      )}

      <div className="lg:pl-[264px]">
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10"
        >
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
