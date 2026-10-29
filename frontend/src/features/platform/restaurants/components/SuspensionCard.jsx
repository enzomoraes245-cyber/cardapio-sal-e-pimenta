import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.jsx';
import { Card } from '../../../../components/ui/Card.jsx';
import { FormFeedback } from '../../../../components/ui/FormFeedback.jsx';
import { FormField, INPUT_CLASS } from '../../../../components/ui/FormField.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { formatDateTime } from '../../../../utils/format-date.js';
import {
  reactivateRestaurant,
  suspendRestaurant,
} from '../services/platform-restaurants.service.js';

/**
 * Suspensão e reativação (DEC-006, item 3). A suspensão pede motivo e confirmação em dois passos,
 * pois bloqueia imediatamente a retaguarda e o cardápio público do restaurante.
 */
export function SuspensionCard({ restaurant, onUpdated }) {
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { submitting, feedback, setFeedback, run } = useSubmit();
  const suspended = restaurant.status === 'SUSPENDED';

  async function suspend() {
    if (!reason.trim()) {
      setFeedback({ tone: 'error', message: 'Informe o motivo da suspensão.' });
      setConfirming(false);
      return;
    }
    await run(async () => onUpdated(await suspendRestaurant(restaurant.id, reason.trim())));
    setConfirming(false);
    setReason('');
  }

  if (suspended) {
    return (
      <Card title="Situação: suspenso">
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
          <p>
            <span className="font-medium">Motivo:</span> {restaurant.suspensionReason}
          </p>
          <p>
            <span className="font-medium">Desde:</span> {formatDateTime(restaurant.suspendedAt)}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Retaguarda e cardápio público estão bloqueados. Ao reativar, o mesmo endereço e QR Code
          voltam a funcionar.
        </p>
        <FormFeedback feedback={feedback} />
        <Button
          disabled={submitting}
          onClick={() =>
            run(
              async () => onUpdated(await reactivateRestaurant(restaurant.id)),
              'Restaurante reativado.',
            )
          }
        >
          Reativar restaurante
        </Button>
      </Card>
    );
  }

  return (
    <Card
      title="Situação: ativo"
      description="Suspender bloqueia a retaguarda e exibe “temporariamente indisponível” no cardápio."
    >
      <FormField label="Motivo da suspensão">
        <textarea
          rows={2}
          maxLength={300}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={INPUT_CLASS}
        />
      </FormField>
      <FormFeedback feedback={feedback} />
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-700">Confirma a suspensão?</span>
          <Button variant="danger" disabled={submitting} onClick={suspend}>
            Confirmar suspensão
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Suspender restaurante
        </Button>
      )}
    </Card>
  );
}
