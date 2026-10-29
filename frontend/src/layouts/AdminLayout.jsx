import { Link, NavLink, Outlet } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { useSession } from '../features/auth/hooks/useSession.js';

const NAV_ITEMS = [
  { to: '/admin', label: 'Início', end: true },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/personalizacao', label: 'Personalização', feature: 'customization' },
  { to: '/admin/qrcode', label: 'QR Code', feature: 'qrcode' },
];

export function AdminLayout() {
  const { restaurant, features, logout } = useSession();
  const items = NAV_ITEMS.filter((item) => !item.feature || features?.[item.feature] !== false);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/admin" className="font-semibold text-slate-900">
            {restaurant?.name ?? 'Retaguarda'}
            <span className="font-normal text-slate-500"> · Retaguarda</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
        <nav aria-label="Retaguarda" className="mx-auto max-w-5xl overflow-x-auto px-4">
          <ul className="flex gap-1 pb-2">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-1.5 text-sm whitespace-nowrap ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
