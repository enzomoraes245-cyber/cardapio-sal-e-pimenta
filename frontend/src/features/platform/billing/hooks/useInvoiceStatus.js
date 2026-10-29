import { useCallback, useState } from 'react';
import { updateInvoiceStatus } from '../services/billing.service.js';

/** Baixa manual de faturas, com a fatura em andamento em `busyId`. */
export function useInvoiceStatus({ onUpdated }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const changeStatus = useCallback(
    async (invoice, status) => {
      setBusyId(invoice.id);
      setError(null);
      try {
        onUpdated(await updateInvoiceStatus(invoice.id, status));
      } catch (updateError) {
        setError(updateError.message);
      } finally {
        setBusyId(null);
      }
    },
    [onUpdated],
  );

  return { busyId, error, changeStatus };
}
