import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { requirePlatformAdmin } from '../middlewares/platform-auth.middleware.js';
import { requireSameOrigin } from '../middlewares/same-origin.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { availabilityRoutes } from '../modules/availability/availability.routes.js';
import { categoryRoutes } from '../modules/categories/category.routes.js';
import { customizationRoutes } from '../modules/customization/customization.routes.js';
import { establishmentRoutes } from '../modules/establishment/establishment.routes.js';
import { menuRoutes } from '../modules/menu/menu.routes.js';
import { platformAuthRoutes } from '../modules/platform/auth/platform-auth.routes.js';
import { billingRoutes } from '../modules/platform/billing/billing.routes.js';
import { platformRestaurantRoutes } from '../modules/platform/restaurants/platform-restaurant.routes.js';
import { categoryProductRoutes, productRoutes } from '../modules/products/product.routes.js';
import { qrcodeRoutes } from '../modules/qrcode/qrcode.routes.js';

/** Roteador da API v1 (montado em /api/v1). */
export const apiRouter = Router();

apiRouter.use(requireSameOrigin);

apiRouter.get('/health', async (req, res) => {
  const databaseUp = await checkDatabaseConnection();
  res.status(databaseUp ? 200 : 503).json({
    data: {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    },
  });
});

apiRouter.use('/auth', authRoutes);

// Rotas públicas: identificam o restaurante pelo slug da URL e expõem só dados publicáveis.
apiRouter.use('/public', menuRoutes);

// Rotas administrativas: toda requisição passa por sessão válida + contexto do restaurante.
const adminRouter = Router();
adminRouter.use(requireAdmin, requireTenant);
adminRouter.use('/categories', categoryRoutes, categoryProductRoutes);
adminRouter.use('/products', productRoutes, availabilityRoutes);
adminRouter.use('/establishment', establishmentRoutes);
adminRouter.use('/customization', customizationRoutes);
adminRouter.use('/qrcode', qrcodeRoutes);
apiRouter.use('/admin', adminRouter);

// Backoffice da plataforma (DEC-006): sessão própria de operador, sem vínculo com restaurante.
const platformRouter = Router();
platformRouter.use('/auth', platformAuthRoutes);
platformRouter.use(requirePlatformAdmin);
platformRouter.use('/restaurants', platformRestaurantRoutes);
platformRouter.use('/audit-events', auditRoutes);
platformRouter.use(billingRoutes);
apiRouter.use('/platform', platformRouter);
