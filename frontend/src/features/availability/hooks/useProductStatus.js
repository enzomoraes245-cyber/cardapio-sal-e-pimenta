import { useCallback, useState } from 'react';
import { updateProductStatus } from '../services/availability.service.js';

/**
 * Alterna a situação de produtos e devolve o produto atualizado pela API em `onUpdated`.
 * Guarda quais produtos estão sendo salvos para desabilitar seus controles.
 */
export function useProductStatus({ onUpdated, onError }) {
  const [savingIds, setSavingIds] = useState(() => new Set());

  const toggle = useCallback(
    async (product, field, value) => {
      setSavingIds((ids) => new Set(ids).add(product.id));
      try {
        onUpdated(await updateProductStatus(product.id, { [field]: value }));
      } catch (error) {
        onError(error);
      } finally {
        setSavingIds((ids) => {
          const next = new Set(ids);
          next.delete(product.id);
          return next;
        });
      }
    },
    [onUpdated, onError],
  );

  return { toggle, isSaving: (productId) => savingIds.has(productId) };
}
