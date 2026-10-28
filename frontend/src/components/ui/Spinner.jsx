/** Indicador de carregamento acessível. */
export function Spinner({ label = 'Carregando...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-stone-600">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span>{label}</span>
    </div>
  );
}
