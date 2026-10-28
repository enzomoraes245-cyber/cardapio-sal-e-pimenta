import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, buildApiUrl } from '../src/services/api.js';

function mockFetchResponse(status, payload) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(payload === undefined ? '' : JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('monta a URL com o prefixo da API', () => {
    expect(buildApiUrl('/health')).toBe('/api/v1/health');
    expect(buildApiUrl('health')).toBe('/api/v1/health');
  });

  it('devolve o conteúdo de "data" e envia cookies de sessão', async () => {
    const fetchMock = mockFetchResponse(200, { data: { status: 'ok' } });

    await expect(apiRequest('/health')).resolves.toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('converte respostas de erro em ApiError', async () => {
    mockFetchResponse(404, {
      error: { code: 'NOT_FOUND', message: 'Restaurante não encontrado.' },
    });

    const error = await apiRequest('/public/restaurants/x/menu').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(error.message).toBe('Restaurante não encontrado.');
  });

  it('sinaliza falha de rede com código NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiRequest('/health')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
