import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { LOCAL_STORAGE_PUBLIC_PATH, storageConfig } from './config/storage.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

export const API_PREFIX = '/api/v1';
const JSON_BODY_LIMIT = '100kb';

/** Cria a aplicação Express (sem abrir porta), permitindo uso direto nos testes. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Atrás de proxy reverso, o IP do cliente (limites de tentativas) vem de X-Forwarded-For.
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());

  // Sem origens configuradas, a API aceita apenas requisições de mesma origem.
  if (env.CORS_ORIGINS.length > 0) {
    app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  }

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  if (storageConfig.driver === 'local') {
    app.use(
      LOCAL_STORAGE_PUBLIC_PATH,
      express.static(storageConfig.localDir, { index: false, dotfiles: 'deny', maxAge: '1h' }),
    );
  }

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
