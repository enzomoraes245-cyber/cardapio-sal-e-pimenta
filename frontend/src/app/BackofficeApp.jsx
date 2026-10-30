import { Route, Routes } from 'react-router';
import { NotFoundState } from '../components/admin/NotFoundState.jsx';
import { ToastProvider } from '../components/admin/Toast.jsx';
import { PLATFORM_AREA } from '../features/auth/areas.js';
import { RequireAuth } from '../features/auth/components/RequireAuth.jsx';
import { SessionProvider } from '../features/auth/components/SessionProvider.jsx';
import { AccountPage } from '../features/auth/pages/AccountPage.jsx';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage.jsx';
import { platformSessionService } from '../features/platform/auth/services/platform-auth.service.js';
import { InvoicesPage } from '../features/platform/billing/pages/InvoicesPage.jsx';
import { PaymentsPage } from '../features/platform/billing/pages/PaymentsPage.jsx';
import { OverviewPage } from '../features/platform/overview/pages/OverviewPage.jsx';
import { NewRestaurantPage } from '../features/platform/restaurants/pages/NewRestaurantPage.jsx';
import { RestaurantDetailPage } from '../features/platform/restaurants/pages/RestaurantDetailPage.jsx';
import { RestaurantsPage } from '../features/platform/restaurants/pages/RestaurantsPage.jsx';
import { BackofficeLayout } from '../layouts/BackofficeLayout.jsx';

const area = PLATFORM_AREA;

/**
 * Backoffice da plataforma (DEC-006), carregado sob demanda.
 * Sessão própria de operador; as rotas são relativas a /backoffice.
 */
export default function BackofficeApp() {
  return (
    <SessionProvider service={platformSessionService}>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<LoginPage area={area} />} />
          <Route path="recuperar-senha" element={<ForgotPasswordPage area={area} />} />
          <Route path="redefinir-senha" element={<ResetPasswordPage area={area} />} />
          <Route element={<RequireAuth area={area} />}>
            <Route element={<BackofficeLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="restaurantes" element={<RestaurantsPage />} />
              <Route path="restaurantes/novo" element={<NewRestaurantPage />} />
              <Route path="restaurantes/:id" element={<RestaurantDetailPage />} />
              <Route path="faturas" element={<InvoicesPage />} />
              <Route path="pagamentos" element={<PaymentsPage />} />
              <Route path="conta" element={<AccountPage area={area} />} />
              <Route path="*" element={<NotFoundState homePath={area.homePath} />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </SessionProvider>
  );
}
