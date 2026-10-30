import { useState } from 'react';
import { Button } from '../../../../components/admin/Button.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { Field, inputClass } from '../../../../components/admin/Field.jsx';
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
    <Panel title="Dados" description={`Endereço do cardápio: /cardapio/${restaurant.slug} (fixo).`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nome do restaurante">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            className={inputClass}
          />
        </Field>
        <FormFeedback feedback={feedback} />
        <Button type="submit" disabled={submitting}>
          Salvar nome
        </Button>
      </form>
    </Panel>
  );
}
