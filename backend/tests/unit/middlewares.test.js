import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../../src/middlewares/error.middleware.js';
import { requireTenant } from '../../src/middlewares/tenant.middleware.js';
import { validate } from '../../src/middlewares/validate.middleware.js';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/shared/errors/app-error.js';

function createResponse() {
  return {
    headersSent: false,
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('validate.middleware', () => {
  const schemas = { body: z.object({ name: z.string().min(1) }) };

  it('armazena os dados validados em req.validated e remove campos desconhecidos', () => {
    const req = { body: { name: 'Bebidas', restaurantId: 'outro-restaurante' } };
    const next = vi.fn();

    validate(schemas)(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validated.body).toEqual({ name: 'Bebidas' });
  });

  it('encaminha ValidationError com os detalhes dos campos inválidos', () => {
    const next = vi.fn();

    validate(schemas)({ body: { name: '' } }, {}, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details).toEqual([expect.objectContaining({ source: 'body', path: 'name' })]);
  });
});

describe('tenant.middleware', () => {
  it('usa o restaurante da sessão e ignora o restaurantId enviado pelo cliente', () => {
    const req = {
      auth: { restaurantId: 'restaurante-da-sessao' },
      body: { restaurantId: 'restaurante-invasor' },
      query: { restaurantId: 'restaurante-invasor' },
    };
    const next = vi.fn();

    requireTenant(req, {}, next);

    expect(req.tenant).toEqual({ restaurantId: 'restaurante-da-sessao' });
    expect(Object.isFrozen(req.tenant)).toBe(true);
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejeita requisições sem sessão autenticada', () => {
    expect(() => requireTenant({}, {}, vi.fn())).toThrow(UnauthorizedError);
  });
});

describe('error.middleware', () => {
  it('converte AppError na resposta JSON padronizada', () => {
    const res = createResponse();

    errorHandler(new NotFoundError('Restaurante não encontrado.'), {}, res, vi.fn());

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Restaurante não encontrado.' },
    });
  });

  it('não expõe detalhes de erros inesperados', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = createResponse();

    errorHandler(new Error('senha do banco: segredo'), {}, res, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('segredo');
    vi.restoreAllMocks();
  });
});
