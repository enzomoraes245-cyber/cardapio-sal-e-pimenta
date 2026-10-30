import { Route, Routes } from 'react-router';
import { NotFoundState } from '../components/admin/NotFoundState.jsx';
import { ToastProvider } from '../components/admin/Toast.jsx';
import { RESTAURANT_AREA } from '../features/auth/areas.js';
import { RequireAuth } from '../features/auth/components/RequireAuth.jsx';
import { RequireFeature } from '../features/auth/components/RequireFeature.jsx';
import { SessionProvider } from '../features/auth/components/SessionProvider.jsx';
import { AccountPage } from '../features/auth/pages/AccountPage.jsx';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage.jsx';
import { adminSessionService } from '../features/auth/services/auth.service.js';
import { CategoriesPage } from '../features/categories/pages/CategoriesPage.jsx';
import { CustomizationPage } from '../features/customization/pages/CustomizationPage.jsx';
import { EstablishmentPage } from '../features/establishment/pages/EstablishmentPage.jsx';
import { ProductFormPage } from '../features/products/pages/ProductFormPage.jsx';
import { ProductsPage } from '../features/products/pages/ProductsPage.jsx';
import { QrCodePage } from '../features/qrcode/pages/QrCodePage.jsx';
import { QrCodePrintPage } from '../features/qrcode/pages/QrCodePrintPage.jsx';
import { AdminHomePage } from '../features/restaurants/pages/AdminHomePage.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';

const area = RESTAURANT_AREA;

/**
 * Painel do restaurante (carregado sob demanda, fora do bundle do cardápio público).
 * As rotas são relativas a /admin.
 */
export default function AdminApp() {
  return (
    <SessionProvider service={adminSessionService}>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<LoginPage area={area} />} />
          <Route path="recuperar-senha" element={<ForgotPasswordPage area={area} />} />
          <Route path="redefinir-senha" element={<ResetPasswordPage area={area} />} />
          <Route element={<RequireAuth area={area} />}>
            {/* Folha de impressão: página inteira, sem o menu do painel. */}
            <Route element={<RequireFeature feature="qrcode" title="QR Code" standalone />}>
              <Route path="qrcode/impressao" element={<QrCodePrintPage />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="categorias" element={<CategoriesPage />} />
              <Route path="produtos" element={<ProductsPage />} />
              <Route path="produtos/novo" element={<ProductFormPage />} />
              <Route path="produtos/:id" element={<ProductFormPage />} />
              <Route path="estabelecimento" element={<EstablishmentPage />} />
              <Route element={<RequireFeature feature="customization" title="Identidade visual" />}>
                <Route path="personalizacao" element={<CustomizationPage />} />
              </Route>
              <Route element={<RequireFeature feature="qrcode" title="QR Code" />}>
                <Route path="qrcode" element={<QrCodePage />} />
              </Route>
              <Route path="conta" element={<AccountPage area={area} />} />
              <Route path="*" element={<NotFoundState homePath={area.homePath} />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </SessionProvider>
  );
}
