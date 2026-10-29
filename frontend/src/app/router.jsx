import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { NotFoundPage } from '../components/shared/NotFoundPage.jsx';
import { RouteErrorPage } from '../components/shared/RouteErrorPage.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { PublicMenuPage } from '../features/menu/pages/PublicMenuPage.jsx';
import { PublicMenuLayout } from '../layouts/PublicMenuLayout.jsx';

// Retaguarda e backoffice ficam em chunks separados: o cardápio público (celular) não os baixa.
const AdminApp = lazy(() => import('./AdminApp.jsx'));

function withSuspense(element) {
  return <Suspense fallback={<Spinner label="Carregando..." />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  {
    // Retaguarda do restaurante autenticado.
    path: '/admin/*',
    element: withSuspense(<AdminApp />),
    errorElement: <RouteErrorPage />,
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
