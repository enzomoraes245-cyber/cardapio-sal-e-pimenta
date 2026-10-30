import { Badge } from '../../../../components/admin/Badge.jsx';
import { INVOICE_SITUATIONS } from '../utils/billing-labels.js';

/** Situação da mensalidade (a vencer, vencida, paga, cancelada), com texto e cor. */
export function InvoiceSituationBadge({ situation }) {
  const { label, tone } = INVOICE_SITUATIONS[situation];
  return <Badge tone={tone}>{label}</Badge>;
}
