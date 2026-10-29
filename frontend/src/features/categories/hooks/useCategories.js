import { useCallback, useState } from 'react';
import { useResource } from '../../../hooks/useResource.js';
import { moveItem } from '../../../utils/move-item.js';
import * as categoriesService from '../services/categories.service.js';

/** Categorias do restaurante com as operações de cadastro, renomeação e ordenação. */
export function useCategories() {
  const resource = useResource(categoriesService.listCategories);
  const { setData } = resource;
  const [reordering, setReordering] = useState(false);
  const [actionError, setActionError] = useState(null);

  const create = useCallback(
    async (data) => {
      const category = await categoriesService.createCategory(data);
      setData((categories) => [...categories, category]);
    },
    [setData],
  );

  const rename = useCallback(
    async (id, data) => {
      const updated = await categoriesService.renameCategory(id, data);
      setData((categories) => categories.map((c) => (c.id === id ? updated : c)));
    },
    [setData],
  );

  /** Move uma posição e salva imediatamente; desfaz na tela se a API recusar. */
  const move = useCallback(
    async (categories, index, offset) => {
      const reordered = moveItem(categories, index, index + offset);
      if (reordered === categories) return;
      setActionError(null);
      setReordering(true);
      setData(reordered);
      try {
        setData(await categoriesService.reorderCategories(reordered.map((c) => c.id)));
      } catch (error) {
        setData(categories);
        setActionError(error.message);
      } finally {
        setReordering(false);
      }
    },
    [setData],
  );

  return { ...resource, reordering, actionError, create, rename, move };
}
