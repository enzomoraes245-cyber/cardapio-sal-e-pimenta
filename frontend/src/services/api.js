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

// Chamado quando uma rota protegida responde 401 (sessão expirada ou encerrada).
let unauthorizedHandler = null;
const PROTECTED_PREFIXES = ['/admin', '/platform'];

/** Registra quem deve reagir a um 401 em rota protegida (ex.: provider de sessão). */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

function serializeBody(body, headers) {
  if (body === undefined) return undefined;
  // FormData (upload de imagens): o navegador define o Content-Type com o boundary.
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  headers['Content-Type'] = 'application/json';
  return JSON.stringify(body);
}

/** Executa a requisição e devolve o conteúdo de `data`, ou lança ApiError. */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const serializedBody = serializeBody(body, headers);

  let response;
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      signal,
      credentials: 'include',
      body: serializedBody,
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
    if (response.status === 401 && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      unauthorizedHandler?.();
    }
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
