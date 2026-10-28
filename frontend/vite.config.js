import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:3333';

  // O proxy mantém frontend e API na mesma origem: cookies de sessão SameSite=Lax/Strict
  // funcionam sem CORS e o SSE não precisa de credenciais cross-origin.
  const proxy = {
    '/api': { target: apiTarget, configure: closeClientOnUpstreamError },
    '/uploads': { target: apiTarget },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{js,jsx}'],
    },
  };
});

/**
 * Se a API cair no meio de uma resposta já iniciada (ex.: stream SSE), o proxy do Vite
 * apenas registra o erro e deixa o navegador com uma conexão pendurada. Encerrá-la faz o
 * EventSource reconectar imediatamente, como aconteceria atrás de um proxy de produção.
 */
function closeClientOnUpstreamError(proxyServer) {
  proxyServer.on('error', (_error, _req, res) => {
    if (res && 'headersSent' in res && res.headersSent && !res.destroyed) res.destroy();
  });
}
