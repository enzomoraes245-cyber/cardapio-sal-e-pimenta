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

// Chamado quando uma rota protegida responde 401 (sessão expirada ou encerrada) ou 403 de
// restaurante suspenso / usuário bloqueado durante o uso.
let sessionErrorHandler = null;
const PROTECTED_PREFIXES = ['/admin', '/platform'];
const SESSION_ERROR_CODES = new Set(['RESTAURANT_SUSPENDED', 'USER_DISABLED']);

/** Registra quem deve reagir a erros de sessão em rota protegida (ex.: provider de sessão). */
export function setSessionErrorHandler(handler) {
  sessionErrorHandler = handler;
  return () => {
    if (sessionErrorHandler === handler) sessionErrorHandler = null;
  };
}

function isSessionError(path, status, code) {
  if (!PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return status === 401 || (status === 403 && SESSION_ERROR_CODES.has(code));
}

function serializeBody(body, headers) {
  if (body === undefined) return undefined;
  // FormData (upload de imagens): o navegador define o Content-Type com o boundary.
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  headers['Content-Type'] = 'application/json';
  return JSON.stringify(body);
}

/**
 * Executa a requisição e devolve o conteúdo de `data`, ou lança ApiError.
 * `headers` acrescenta cabeçalhos (ex.: Idempotency-Key nos cadastros).
 */
export async function apiRequest(
  path,
  { method = 'GET', body, signal, headers: extraHeaders } = {},
) {
  const headers = { Accept: 'application/json', ...extraHeaders };
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
    const error = new ApiError(apiError?.message ?? `Erro HTTP ${response.status}.`, {
      status: response.status,
      code: apiError?.code ?? 'HTTP_ERROR',
      details: apiError?.details,
    });
    if (isSessionError(path, error.status, error.code)) sessionErrorHandler?.(error);
    throw error;
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
