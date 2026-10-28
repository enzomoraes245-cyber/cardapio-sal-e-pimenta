import { AppError } from '../shared/errors/app-error.js';

/** Responde 404 para rotas inexistentes no formato padrão de erro. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' } });
}

/**
 * Tratamento centralizado de erros.
 * Formato de resposta: { error: { code, message, details? } }.
 * Erros inesperados nunca expõem detalhes internos ao cliente.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Corpo da requisição inválido.' } });
  }

  if (err?.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Corpo da requisição muito grande.' } });
  }

  console.error('[error]', err);
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
}
