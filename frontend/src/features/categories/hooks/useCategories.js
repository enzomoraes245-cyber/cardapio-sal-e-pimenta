import { useCallback, useState } from 'react';
import { useResource } from '../../../hooks/useResource.js';
import { moveItem } from '../../../utils/move-item.js';
import * as categoriesService from '../services/categories.service.js';

/** Categorias do restaurante com cadastro, renomeação, exibição e ordenação. */
export function useCategories() {
  const resource = useResource(categoriesService.listCategories);
  const { setData } = resource;
  const [reordering, setReordering] = useState(false);

  const replace = useCallback(
    (updated) =>
      setData((categories) => (categories ?? []).map((c) => (c.id === updated.id ? updated : c))),
    [setData],
  );

  // Uma categoria repetida (mesma chave) volta com o mesmo id: não entra duas vezes na lista.
  const create = useCallback(
    async (data, options) => {
      const category = await categoriesService.createCategory(data, options);
      setData((categories) => [
        ...(categories ?? []).filter((c) => c.id !== category.id),
        category,
      ]);
      return category;
    },
    [setData],
  );

  const rename = useCallback(
    async (id, data) => replace(await categoriesService.renameCategory(id, data)),
    [replace],
  );

  const setStatus = useCallback(
    async (id, isActive) => replace(await categoriesService.setCategoryStatus(id, isActive)),
    [replace],
  );

  /** Move uma posição e salva; desfaz na tela e devolve o erro se a API recusar. */
  const move = useCallback(
    async (categories, index, offset) => {
      const reordered = moveItem(categories, index, index + offset);
      if (reordered === categories) return null;
      setReordering(true);
      setData(reordered);
      try {
        setData(await categoriesService.reorderCategories(reordered.map((c) => c.id)));
        return null;
      } catch (error) {
        setData(categories);
        return error;
      } finally {
        setReordering(false);
      }
    },
    [setData],
  );

  return { ...resource, reordering, create, rename, setStatus, move };
}
