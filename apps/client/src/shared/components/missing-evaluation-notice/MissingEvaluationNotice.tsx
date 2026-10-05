import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';

export function MissingEvaluationNotice() {
  return (
    <AlertBanner
      className="fr-mb-4v rounded px-3 py-2"
      icon="fr-icon-draft-line"
      message={<FormattedMessage defaultMessage="Évaluation manquante dans le dossier administratif LOLFI" />}
      tone="warning"
    />
  );
}
