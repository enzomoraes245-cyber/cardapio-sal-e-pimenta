import { useState } from 'react';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button } from '../../../../components/admin/Button.jsx';
import { Switch } from '../../../../components/admin/Field.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { useSubmit } from '../../../../hooks/useSubmit.js';
import { updateFeatures } from '../services/platform-restaurants.service.js';
import { FEATURE_LABELS } from '../utils/feature-labels.js';

/** Liberação dos módulos do restaurante (DEC-006). Vale na hora, inclusive para cardápios abertos. */
export function FeaturesPanel({ restaurant, onUpdated }) {
  const toast = useToast();
  const [values, setValues] = useState(restaurant.features);
  const { submitting, feedback, run } = useSubmit();
  const changed = FEATURE_LABELS.some(({ key }) => values[key] !== restaurant.features[key]);

  async function handleSave() {
    const ok = await run(async () => onUpdated(await updateFeatures(restaurant.id, values)));
    if (ok) toast.success('Módulos atualizados.');
  }

  return (
    <Panel
      title="Módulos"
      description="Alterações valem na hora, inclusive para quem estiver com o cardápio aberto."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => setValues(restaurant.features)}
            disabled={!changed || submitting}
          >
            Descartar
          </Button>
          <Button onClick={handleSave} disabled={!changed} loading={submitting}>
            Salvar módulos
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {feedback?.tone === 'error' && <Alert tone="danger">{feedback.message}</Alert>}
        {FEATURE_LABELS.map(({ key, label, hint }) => (
          <Switch
            key={key}
            label={label}
            description={hint}
            checked={values[key]}
            disabled={submitting}
            onChange={(checked) => setValues({ ...values, [key]: checked })}
          />
        ))}
      </div>
    </Panel>
  );
}
