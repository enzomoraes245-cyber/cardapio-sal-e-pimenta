import { useCallback, useMemo, useState } from 'react';
import { useResource } from '../../../hooks/useResource.js';
import { moveItem } from '../../../utils/move-item.js';
import { listCategories } from '../../categories/services/categories.service.js';
import * as productsService from '../services/products.service.js';

async function loadCatalog({ signal }) {
  const [categories, products] = await Promise.all([
    listCategories({ signal }),
    productsService.listProducts({ signal }),
  ]);
  return { categories, products };
}

/** Produtos agrupados por categoria (na ordem das categorias), com ordenação e atualização local. */
export function useProducts() {
  const resource = useResource(loadCatalog);
  const { data, setData } = resource;
  const [reordering, setReordering] = useState(false);

  const groups = useMemo(() => {
    if (!data) return [];
    return data.categories.map((category) => ({
      category,
      products: data.products.filter((product) => product.category.id === category.id),
    }));
  }, [data]);

  const replaceProduct = useCallback(
    (updated) =>
      setData((current) => ({
        ...current,
        products: current.products.map((p) => (p.id === updated.id ? updated : p)),
      })),
    [setData],
  );

  /**
   * Move o produto dentro da categoria e salva; desfaz na tela se a API recusar.
   * Devolve o erro (ou null) para quem chamou avisar o usuário.
   */
  const move = useCallback(
    async (categoryId, products, index, offset) => {
      const reordered = moveItem(products, index, index + offset);
      if (reordered === products) return null;
      const previous = data;
      const applyOrder = (ordered) =>
        setData((current) => ({
          ...current,
          products: [...current.products.filter((p) => p.category.id !== categoryId), ...ordered],
        }));

      setReordering(true);
      applyOrder(reordered);
      try {
        applyOrder(
          await productsService.reorderProducts(
            categoryId,
            reordered.map((p) => p.id),
          ),
        );
        return null;
      } catch (error) {
        setData(previous);
        return error;
      } finally {
        setReordering(false);
      }
    },
    [data, setData],
  );

  return { ...resource, groups, reordering, move, replaceProduct };
}
