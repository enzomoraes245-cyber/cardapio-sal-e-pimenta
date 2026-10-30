import { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { CheckIcon, CopyIcon } from './icons.jsx';

const RESET_AFTER_MS = 2500;

/** Copia texto; em página sem HTTPS (ex.: IP da rede local) usa o método antigo do navegador. */
async function copyText(text) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = document.execCommand?.('copy');
  area.remove();
  if (!copied) throw new Error('Cópia não suportada.');
}

/**
 * Botão "Copiar" com retorno anunciado (sucesso ou falha). O rótulo volta ao normal sozinho.
 */
export function CopyButton({
  text,
  label = 'Copiar',
  copiedLabel = 'Copiado',
  successMessage = 'Copiado para a área de transferência.',
  variant = 'secondary',
  size = 'md',
  className,
}) {
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (state === 'idle') return undefined;
    const timer = setTimeout(() => setState('idle'), RESET_AFTER_MS);
    return () => clearTimeout(timer);
  }, [state]);

  async function handleClick() {
    try {
      await copyText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant={variant}
        size={size}
        icon={state === 'copied' ? CheckIcon : CopyIcon}
        onClick={handleClick}
        className={className}
      >
        {state === 'copied' ? copiedLabel : label}
      </Button>
      <span role="status" className={state === 'failed' ? 'text-xs text-admin-danger' : 'sr-only'}>
        {state === 'copied' && successMessage}
        {state === 'failed' && 'Não foi possível copiar. Selecione o texto e copie manualmente.'}
      </span>
    </span>
  );
}
