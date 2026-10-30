/** Texto para busca: sem acentos, minúsculo e sem espaços nas pontas. */
export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Verdadeiro se algum dos textos contém a busca (ignorando acentos e maiúsculas). */
export function matchesSearch(query, ...texts) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return texts.some((text) => normalizeSearch(text).includes(needle));
}
