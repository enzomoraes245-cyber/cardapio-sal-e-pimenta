import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.jsx';
import { Card } from '../../../../components/ui/Card.jsx';
import { FormFeedback } from '../../../../components/ui/FormFeedback.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { updateFeatures } from '../services/platform-restaurants.service.js';
import { FeatureCheckboxes } from './FeatureCheckboxes.jsx';

/** Liberação de módulos por restaurante (DEC-006, item 4). */
export function FeaturesCard({ restaurant, onUpdated }) {
  const [features, setFeatures] = useState(restaurant.features);
  const { submitting, feedback, run } = useSubmit();

  return (
    <Card
      title="Módulos"
      description="Alterações valem na hora, inclusive para cardápios já abertos."
    >
      <FeatureCheckboxes value={features} onChange={setFeatures} disabled={submitting} />
      <FormFeedback feedback={feedback} />
      <Button
        disabled={submitting}
        onClick={() =>
          run(
            async () => onUpdated(await updateFeatures(restaurant.id, features)),
            'Módulos atualizados.',
          )
        }
      >
        Salvar módulos
      </Button>
    </Card>
  );
}
