/**
 * Campos que mudam de `current` para `next` (só as chaves de `next`), no formato gravado no
 * histórico: { campo: { from, to } }. Valores ausentes contam como null.
 */
export function changedFields(current, next) {
  const changes = {};
  for (const [field, value] of Object.entries(next)) {
    const before = current?.[field] ?? null;
    const after = value ?? null;
    if (String(before) !== String(after)) changes[field] = { from: before, to: after };
  }
  return changes;
}
