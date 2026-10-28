import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { requireTenant } from '../middlewares/tenant.middleware.js';
import { menuRoutes } from '../modules/menu/menu.routes.js';

/** Roteador da API v1 (montado em /api/v1). */
export const apiRouter = Router();

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

// Rotas públicas: identificam o restaurante pelo slug da URL e expõem só dados publicáveis.
apiRouter.use('/public', menuRoutes);

// Rotas administrativas: toda requisição passa por sessão válida + contexto do restaurante.
// Os módulos administrativos (categories, products, availability, customization, qrcode)
// serão montados neste roteador nas próximas etapas.
const adminRouter = Router();
adminRouter.use(requireAdmin, requireTenant);
apiRouter.use('/admin', adminRouter);
