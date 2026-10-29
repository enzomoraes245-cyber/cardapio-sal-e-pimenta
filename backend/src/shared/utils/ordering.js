import { ValidationError } from '../errors/app-error.js';

/**
 * Garante que a nova ordem contém exatamente os itens existentes, sem repetição.
 * Impede reordenar itens de outro restaurante ou omitir itens (RN-008).
 */
export function assertCompleteOrder(existingIds, orderedIds) {
  const existing = new Set(existingIds);
  const received = new Set(orderedIds);
  const isComplete =
    received.size === orderedIds.length &&
    received.size === existing.size &&
    orderedIds.every((id) => existing.has(id));

  if (!isComplete) {
    throw new ValidationError(
      [{ source: 'body', path: 'ids', message: 'Informe todos os itens, sem repetição.' }],
      'A nova ordem deve conter todos os itens, sem repetição.',
    );
  }
}
