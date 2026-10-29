import { Route, Routes } from 'react-router';
import { NotFoundPage } from '../components/shared/NotFoundPage.jsx';
import { RequireAuth } from '../features/auth/components/RequireAuth.jsx';
import { SessionProvider } from '../features/auth/components/SessionProvider.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { CategoriesPage } from '../features/categories/pages/CategoriesPage.jsx';
import { CustomizationPage } from '../features/customization/pages/CustomizationPage.jsx';
import { ProductFormPage } from '../features/products/pages/ProductFormPage.jsx';
import { ProductsPage } from '../features/products/pages/ProductsPage.jsx';
import { QrCodePage } from '../features/qrcode/pages/QrCodePage.jsx';
import { AdminHomePage } from '../features/restaurants/pages/AdminHomePage.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';

/**
 * Retaguarda do restaurante (carregada sob demanda, fora do bundle do cardápio público).
 * As rotas são relativas a /admin.
 */
export default function AdminApp() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="produtos/novo" element={<ProductFormPage />} />
            <Route path="produtos/:id" element={<ProductFormPage />} />
            <Route path="personalizacao" element={<CustomizationPage />} />
            <Route path="qrcode" element={<QrCodePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </SessionProvider>
  );
}
