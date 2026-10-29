/**
 * Erro de aplicação com status HTTP e código estável.
 * Lançado pelos services e convertido em resposta JSON pelo error.middleware.
 */
export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details, message = 'Dados inválidos.') {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária.') {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso não permitido.', code = 'FORBIDDEN') {
    super(message, { statusCode: 403, code });
  }
}

/** Restaurante suspenso pelo backoffice (DEC-006). */
export class RestaurantSuspendedError extends ForbiddenError {
  constructor(message = 'Este restaurante está temporariamente indisponível.') {
    super(message, 'RESTAURANT_SUSPENDED');
  }
}

export class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT', details) {
    super(message, { statusCode: 409, code, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}
