import { ValidationError } from '../shared/errors/app-error.js';

const SOURCES = ['params', 'query', 'body'];

/**
 * Valida params, query e body com schemas Zod.
 * Os dados validados (com campos desconhecidos removidos) ficam em req.validated;
 * controllers devem ler somente de req.validated.
 *
 * @param {{ params?: import('zod').ZodType, query?: import('zod').ZodType, body?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return function validateRequest(req, res, next) {
    const validated = {};
    const issues = [];

    for (const source of SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source] ?? {});
      if (result.success) {
        validated[source] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ source, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) return next(new ValidationError(issues));

    req.validated = validated;
    return next();
  };
}
