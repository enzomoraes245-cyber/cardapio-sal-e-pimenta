const STATUS_FIELDS = [
  { field: 'isActive', on: 'Ativo', off: 'Inativo' },
  { field: 'isAvailable', on: 'Disponível', off: 'Indisponível' },
];

/**
 * Interruptores de situação do produto (RF-014, RF-015).
 * `onChange(field, value)` deve persistir a alteração.
 */
export function ProductStatusToggles({ product, disabled, onChange }) {
  return (
    <div className="flex gap-2">
      {STATUS_FIELDS.map(({ field, on, off }) => {
        const checked = product[field];
        return (
          <button
            key={field}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={`${on}: ${product.name}`}
            disabled={disabled}
            onClick={() => onChange(field, !checked)}
            className={`rounded-full border px-3 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 ${
              checked
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-300 bg-slate-100 text-slate-600'
            }`}
          >
            {checked ? on : off}
          </button>
        );
      })}
    </div>
  );
}
