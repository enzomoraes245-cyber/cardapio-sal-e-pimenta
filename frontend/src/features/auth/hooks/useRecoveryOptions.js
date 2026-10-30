import { useEffect, useState } from 'react';

/**
 * Consulta se a recuperação de senha por e-mail está disponível na área.
 * Enquanto carrega ou se a consulta falhar, considera indisponível (a tela orienta a procurar o
 * suporte), sem exibir erro.
 */
export function useRecoveryOptions(area) {
  const [options, setOptions] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    area.account
      .getRecoveryOptions({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setOptions(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptions({ emailRecovery: false });
      });
    return () => controller.abort();
  }, [area]);

  return options;
}
