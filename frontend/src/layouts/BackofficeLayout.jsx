import { BanknoteIcon, OverviewIcon, ReceiptIcon, StoreIcon } from '../components/admin/icons.jsx';
import { PLATFORM_AREA } from '../features/auth/areas.js';
import { useSession } from '../features/auth/hooks/useSession.js';
import { AdminShell } from './AdminShell.jsx';

const NAVIGATION = [
  {
    items: [
      { to: '/backoffice', label: 'Visão geral', icon: OverviewIcon, end: true },
      { to: '/backoffice/restaurantes', label: 'Restaurantes', icon: StoreIcon },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/backoffice/faturas', label: 'Mensalidades', icon: ReceiptIcon },
      { to: '/backoffice/pagamentos', label: 'Pagamentos', icon: BanknoteIcon },
    ],
  },
];

/** Estrutura do backoffice da plataforma (/backoffice), separada do painel do restaurante. */
export function BackofficeLayout() {
  const { admin, logout } = useSession();
  return (
    <AdminShell
      environment={PLATFORM_AREA.environment}
      homePath={PLATFORM_AREA.homePath}
      accountPath={PLATFORM_AREA.accountPath}
      navigation={NAVIGATION}
      user={admin}
      onLogout={logout}
    />
  );
}
