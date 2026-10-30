import { IconButton } from './Button.jsx';
import { ArrowDownIcon, ArrowUpIcon } from './icons.jsx';

/**
 * Botões para subir/descer um item numa lista ordenada. Nas pontas ficam aria-disabled (e não
 * disabled) para o foco do teclado não se perder quando o item chega ao início ou ao fim.
 */
export function ReorderButtons({ label, isFirst, isLast, disabled, onMove }) {
  const upBlocked = disabled || isFirst;
  const downBlocked = disabled || isLast;
  const blockedClass =
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent';

  return (
    <div className="flex gap-0.5" role="group" aria-label={`Ordem de ${label}`}>
      <IconButton
        label={`Mover ${label} para cima`}
        icon={ArrowUpIcon}
        size="sm"
        aria-disabled={upBlocked || undefined}
        onClick={() => !upBlocked && onMove(-1)}
        className={blockedClass}
      />
      <IconButton
        label={`Mover ${label} para baixo`}
        icon={ArrowDownIcon}
        size="sm"
        aria-disabled={downBlocked || undefined}
        onClick={() => !downBlocked && onMove(1)}
        className={blockedClass}
      />
    </div>
  );
}
