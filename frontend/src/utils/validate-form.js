/**
 * Valida valores de formulário com um schema Zod.
 * Retorna { data } quando válido ou { errors } com a primeira mensagem de cada campo.
 */
export function validateForm(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'form';
    errors[field] ??= issue.message;
  }
  return { data: null, errors };
}

/**
 * Converte os detalhes de um erro da API em erros por campo. Vale para VALIDATION_ERROR e para
 * conflitos que apontam o campo (ex.: SLUG_TAKEN em "slug", EMAIL_TAKEN em "admin.email").
 */
export function apiValidationErrors(error) {
  if (!Array.isArray(error?.details)) return null;
  const errors = {};
  for (const detail of error.details) {
    if (detail.path) errors[detail.path] ??= detail.message;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
