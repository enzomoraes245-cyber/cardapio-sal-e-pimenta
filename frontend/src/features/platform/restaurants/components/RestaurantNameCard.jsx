import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.jsx';
import { Card } from '../../../../components/ui/Card.jsx';
import { FormFeedback } from '../../../../components/ui/FormFeedback.jsx';
import { FormField, INPUT_CLASS } from '../../../../components/ui/FormField.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { renameRestaurant } from '../services/platform-restaurants.service.js';

/** Nome comercial. O endereço (slug) é fixo para manter o QR Code válido (RN-013). */
export function RestaurantNameCard({ restaurant, onUpdated }) {
  const [name, setName] = useState(restaurant.name);
  const { submitting, feedback, setFeedback, run } = useSubmit();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setFeedback({ tone: 'error', message: 'Informe o nome.' });
    await run(
      async () => onUpdated(await renameRestaurant(restaurant.id, name.trim())),
      'Nome atualizado.',
    );
  }

  return (
    <Card title="Dados" description={`Endereço do cardápio: /cardapio/${restaurant.slug} (fixo).`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Nome do restaurante">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormFeedback feedback={feedback} />
        <Button type="submit" disabled={submitting}>
          Salvar nome
        </Button>
      </form>
    </Card>
  );
}
