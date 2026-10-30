import { Badge } from '../../../../components/admin/Badge.jsx';

/** Situação operacional do restaurante (independente da situação financeira). */
export function RestaurantStatusBadge({ status }) {
  return status === 'SUSPENDED' ? (
    <Badge tone="danger">Suspenso</Badge>
  ) : (
    <Badge tone="success">Ativo</Badge>
  );
}
