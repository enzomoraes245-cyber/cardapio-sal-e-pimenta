import { Button } from './Button.jsx';

/** Botões acessíveis para subir/descer um item em uma lista ordenada. */
export function ReorderButtons({ label, isFirst, isLast, disabled, onMove }) {
  return (
    <div className="flex gap-1">
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Mover ${label} para cima`}
        disabled={disabled || isFirst}
        onClick={() => onMove(-1)}
      >
        ↑
      </Button>
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Mover ${label} para baixo`}
        disabled={disabled || isLast}
        onClick={() => onMove(1)}
      >
        ↓
      </Button>
    </div>
  );
}
