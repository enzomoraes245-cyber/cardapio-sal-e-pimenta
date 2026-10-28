import { ApiError, api } from './api.js';

/** Consulta o health check. 503 significa API no ar, mas banco de dados indisponível. */
export async function getApiHealth({ signal } = {}) {
  try {
    return await api.get('/health', { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return { status: 'degraded', database: 'down' };
    }
    throw error;
  }
}
