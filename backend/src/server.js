import { API_PREFIX, createApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}${API_PREFIX}`);
});

function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando a API...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Conexões SSE são longas: encerra-as para o servidor poder fechar.
  server.closeAllConnections();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
