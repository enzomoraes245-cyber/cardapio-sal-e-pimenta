import { useState } from 'react';
import { Button } from '../../../../components/admin/Button.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { FormFeedback } from '../../../../components/admin/Alert.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { updateFeatures } from '../services/platform-restaurants.service.js';
import { FeatureCheckboxes } from './FeatureCheckboxes.jsx';

/** Liberação de módulos por restaurante (DEC-006, item 4). */
export function FeaturesCard({ restaurant, onUpdated }) {
  const [features, setFeatures] = useState(restaurant.features);
  const { submitting, feedback, run } = useSubmit();

  return (
    <Panel
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
    </Panel>
  );
}
