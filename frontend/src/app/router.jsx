import { Navigate, createBrowserRouter } from 'react-router';
import { NotFoundPage } from '../components/shared/NotFoundPage.jsx';
import { RouteErrorPage } from '../components/shared/RouteErrorPage.jsx';
import { PublicMenuPage } from '../features/menu/pages/PublicMenuPage.jsx';
import { AdminHomePage } from '../features/restaurants/pages/AdminHomePage.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { PublicMenuLayout } from '../layouts/PublicMenuLayout.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  {
    // Retaguarda do restaurante autenticado (telas e login nas próximas etapas).
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <AdminHomePage /> }],
  },
  {
    // Cardápio público acessado pelo QR Code.
    path: '/cardapio/:slug',
    element: <PublicMenuLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <PublicMenuPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);
