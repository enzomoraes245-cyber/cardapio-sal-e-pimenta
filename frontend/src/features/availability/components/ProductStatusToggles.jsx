import { Switch } from '../../../components/admin/Field.jsx';

const STATUS_FIELDS = [
  { field: 'isActive', label: 'Ativo' },
  { field: 'isAvailable', label: 'Disponível' },
];

/**
 * Interruptores de situação do produto (RF-014, RF-015). O rótulo visível é fixo ("Ativo",
 * "Disponível") e o estado vem do próprio interruptor; o nome acessível inclui o produto.
 * `onChange(field, value)` deve persistir a alteração.
 */
export function ProductStatusToggles({ product, disabled, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {STATUS_FIELDS.map(({ field, label }) => (
        <div key={field} className="flex items-center gap-2">
          <Switch
            label={`${label}: ${product.name}`}
            hideLabel
            checked={product[field]}
            disabled={disabled}
            onChange={(value) => onChange(field, value)}
          />
          <span aria-hidden="true" className="text-[13px] font-medium text-admin-muted">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
