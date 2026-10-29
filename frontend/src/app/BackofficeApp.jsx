import { Route, Routes } from 'react-router';
import { NotFoundPage } from '../components/shared/NotFoundPage.jsx';
import { RequireAuth } from '../features/auth/components/RequireAuth.jsx';
import { SessionProvider } from '../features/auth/components/SessionProvider.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { InvoicesPage } from '../features/platform/billing/pages/InvoicesPage.jsx';
import { platformSessionService } from '../features/platform/auth/services/platform-auth.service.js';
import { NewRestaurantPage } from '../features/platform/restaurants/pages/NewRestaurantPage.jsx';
import { RestaurantDetailPage } from '../features/platform/restaurants/pages/RestaurantDetailPage.jsx';
import { RestaurantsPage } from '../features/platform/restaurants/pages/RestaurantsPage.jsx';
import { BackofficeLayout } from '../layouts/BackofficeLayout.jsx';

/**
 * Backoffice da plataforma (DEC-006), carregado sob demanda.
 * Sessão própria de operador; as rotas são relativas a /backoffice.
 */
export default function BackofficeApp() {
  return (
    <SessionProvider service={platformSessionService}>
      <Routes>
        <Route
          path="login"
          element={
            <LoginPage
              title="Backoffice da plataforma"
              description="Acesso restrito aos operadores da plataforma."
              homePath="/backoffice"
              devArea="platform"
            />
          }
        />
        <Route element={<RequireAuth loginPath="/backoffice/login" />}>
          <Route element={<BackofficeLayout />}>
            <Route index element={<RestaurantsPage />} />
            <Route path="restaurantes/novo" element={<NewRestaurantPage />} />
            <Route path="restaurantes/:id" element={<RestaurantDetailPage />} />
            <Route path="faturas" element={<InvoicesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </SessionProvider>
  );
}
