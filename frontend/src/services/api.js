/**
 * Cliente HTTP centralizado da API.
 * Respostas de sucesso seguem { data }, erros seguem { error: { code, message, details? } }.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Executa a requisição e devolve o conteúdo de `data`, ou lança ApiError. */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      signal,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar ao servidor.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const apiError = payload?.error;
    throw new ApiError(apiError?.message ?? `Erro HTTP ${response.status}.`, {
      status: response.status,
      code: apiError?.code ?? 'HTTP_ERROR',
      details: apiError?.details,
    });
  }

  return payload?.data ?? null;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
