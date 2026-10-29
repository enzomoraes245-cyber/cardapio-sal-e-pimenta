import { useCallback, useState } from 'react';

/**
 * Executa uma ação assíncrona de formulário com estado de envio e mensagem de retorno.
 * `run(action, successMessage)` devolve true em caso de sucesso.
 */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const run = useCallback(async (action, successMessage) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      await action();
      if (successMessage) setFeedback({ tone: 'success', message: successMessage });
      return true;
    } catch (error) {
      setFeedback({ tone: 'error', message: error.message, error });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, feedback, setFeedback, run };
}
