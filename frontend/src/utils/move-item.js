/** Retorna uma cópia da lista com o item do índice `from` movido para `to`. */
export function moveItem(items, from, to) {
  if (to < 0 || to >= items.length || from === to) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
