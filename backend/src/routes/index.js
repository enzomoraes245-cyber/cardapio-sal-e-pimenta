import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { requireSameOrigin } from '../middlewares/same-origin.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { categoryRoutes } from '../modules/categories/category.routes.js';
import { menuRoutes } from '../modules/menu/menu.routes.js';

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
adminRouter.use('/categories', categoryRoutes);
apiRouter.use('/admin', adminRouter);
