import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { CallForApplicationsModal } from './CallForApplicationsModal';

export function CreateCallForApplicationsButton() {
  // the modal outlives the closing so that it fades out with its content
  const [creation, setCreation] = useState<{ open: boolean } | null>(null);

  return (
    <>
      <Button
        className="btn-compact"
        iconId="fr-icon-add-line"
        onClick={() => setCreation({ open: true })}
        size="small"
      >
        <FormattedMessage defaultMessage="Créer un appel à candidatures" />
      </Button>
      {creation && (
        <CallForApplicationsModal
          edited={null}
          onClose={() => setCreation({ open: false })}
          onClosed={() => setCreation(null)}
          open={creation.open}
        />
      )}
    </>
  );
}
