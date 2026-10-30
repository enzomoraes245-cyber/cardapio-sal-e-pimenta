import { useCallback, useRef, useState } from 'react';

/**
 * Executa uma ação assíncrona de formulário com estado de envio e mensagem de retorno.
 * `run(action, successMessage)` devolve true em caso de sucesso. Enquanto um envio está em
 * andamento, novas chamadas são ignoradas (devolvem false): evita cadastros duplicados por
 * clique duplo, mesmo antes de o botão ser desabilitado na tela.
 */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const inFlight = useRef(false);

  const run = useCallback(async (action, successMessage) => {
    if (inFlight.current) return false;
    inFlight.current = true;
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
      inFlight.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submitting, feedback, setFeedback, run };
}
