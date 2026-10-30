import { cx } from './cx.js';

/** Indicador de progresso para botões e linhas (decorativo: o estado vai em aria-busy/texto). */
export function InlineSpinner({ size = 16, className }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cx(
        'inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:[animation-duration:1.6s]',
        className,
      )}
    />
  );
}
