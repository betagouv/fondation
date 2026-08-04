import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useAlerts } from '@/shared/context/alerts';
import {
  useDetailedNominationSessionAffectationsVersionQuery,
  usePublishVersionMutation,
} from '@queries/nomination-sessions.queries';

export function NominationFilesPublishButton() {
  const alerts = useAlerts();
  const { formatMessage } = useIntl();
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);
  const { mutate: publishAffectations, isPending: isPublishing } = usePublishVersionMutation();

  const onPublishAffectations = useCallback(() => {
    publishAffectations(
      { sessionId },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: formatMessage({ defaultMessage: 'Session publiée avec succès' }),
          });
        },

        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: formatMessage({ defaultMessage: 'Erreur lors de la publication des affectations' }),
          });
        },
      },
    );
  }, [alerts, formatMessage, publishAffectations, sessionId]);

  const hasNoVersionYet = affectationsVersion?.version === 0;
  const isDraft =
    !!affectationsVersion && 'status' in affectationsVersion && affectationsVersion.status === 'BROUILLON';

  if (!isEditable || (!isDraft && !hasNoVersionYet)) return null;

  return (
    <Button
      className="py-2!"
      disabled={isPublishing}
      iconId="ri-megaphone-fill"
      onClick={onPublishAffectations}
      priority="primary"
      size="small"
    >
      {isPublishing
        ? formatMessage({ defaultMessage: 'Publication en cours...' })
        : formatMessage({ defaultMessage: 'Publier aux membres' })}
    </Button>
  );
}
