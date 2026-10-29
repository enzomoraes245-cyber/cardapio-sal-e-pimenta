const MAX_SLUG_LENGTH = 80;

/** Sugere o identificador da URL a partir do nome: "Sal & Pimenta" → "sal-pimenta". */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
}
