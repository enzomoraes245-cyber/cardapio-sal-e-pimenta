import { Link, NavLink, Outlet } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { useSession } from '../features/auth/hooks/useSession.js';

const NAV_ITEMS = [
  { to: '/backoffice', label: 'Restaurantes', end: true },
  { to: '/backoffice/faturas', label: 'Faturas' },
];

/** Layout do backoffice da plataforma (DEC-006), visualmente distinto da retaguarda. */
export function BackofficeLayout() {
  const { admin, logout } = useSession();

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/backoffice" className="font-semibold">
            Cardápio Digital <span className="font-normal text-slate-300">· Backoffice</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">{admin?.name}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
        <nav aria-label="Backoffice" className="mx-auto max-w-6xl px-4">
          <ul className="flex gap-1 pb-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-1.5 text-sm ${
                      isActive ? 'bg-white text-slate-900' : 'text-slate-200 hover:bg-slate-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
