import {
  HomeIcon,
  LayersIcon,
  PackageIcon,
  PaletteIcon,
  QrCodeIcon,
  StoreIcon,
  UtensilsIcon,
} from '../components/admin/icons.jsx';
import { RESTAURANT_AREA } from '../features/auth/areas.js';
import { useSession } from '../features/auth/hooks/useSession.js';
import { AdminShell } from './AdminShell.jsx';

/** Itens do menu do painel; os de módulos bloqueados pelo backoffice não aparecem. */
function buildNavigation(features, restaurant) {
  const enabled = (feature) => features?.[feature] !== false;
  return [
    { items: [{ to: '/admin', label: 'Início', icon: HomeIcon, end: true }] },
    {
      label: 'Cardápio',
      items: [
        { to: '/admin/produtos', label: 'Produtos', icon: PackageIcon },
        { to: '/admin/categorias', label: 'Categorias', icon: LayersIcon },
      ],
    },
    {
      label: 'Estabelecimento',
      items: [
        { to: '/admin/estabelecimento', label: 'Dados do estabelecimento', icon: StoreIcon },
        enabled('customization') && {
          to: '/admin/personalizacao',
          label: 'Identidade visual',
          icon: PaletteIcon,
        },
        enabled('qrcode') && { to: '/admin/qrcode', label: 'QR Code', icon: QrCodeIcon },
        { href: `/cardapio/${restaurant.slug}`, label: 'Ver cardápio', icon: UtensilsIcon },
      ].filter(Boolean),
    },
  ];
}

function RestaurantContext({ restaurant }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-admin-sidebar-muted uppercase">
        Restaurante
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{restaurant.name}</p>
      <p className="truncate text-xs text-admin-sidebar-muted">/cardapio/{restaurant.slug}</p>
    </div>
  );
}

/** Estrutura do painel do restaurante (/admin). */
export function AdminLayout() {
  const { admin, restaurant, features, logout } = useSession();
  return (
    <AdminShell
      environment={RESTAURANT_AREA.environment}
      homePath={RESTAURANT_AREA.homePath}
      accountPath={RESTAURANT_AREA.accountPath}
      navigation={buildNavigation(features, restaurant)}
      context={<RestaurantContext restaurant={restaurant} />}
      user={admin}
      onLogout={logout}
    />
  );
}
