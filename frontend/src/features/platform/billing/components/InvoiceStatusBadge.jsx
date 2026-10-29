const STYLES = {
  PAID: ['Paga', 'bg-emerald-100 text-emerald-800'],
  CANCELED: ['Cancelada', 'bg-slate-100 text-slate-600'],
  OPEN: ['Em aberto', 'bg-amber-100 text-amber-800'],
  OVERDUE: ['Vencida', 'bg-red-100 text-red-800'],
};

export function InvoiceStatusBadge({ invoice }) {
  const [label, className] = STYLES[invoice.overdue ? 'OVERDUE' : invoice.status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
