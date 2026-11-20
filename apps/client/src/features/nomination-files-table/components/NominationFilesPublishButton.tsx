import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useToasts } from '@/shared/ui/toast';
import {
  useDetailAffectationHistoryQuery,
  usePublishVersionMutation,
} from '@queries/nomination-sessions.queries';

export function NominationFilesPublishButton() {
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const { canManage, sessionId } = useNominationFilesTable();
  const { data: history } = useDetailAffectationHistoryQuery(sessionId);
  const { mutate: publishAffectations, isPending: isPublishing } = usePublishVersionMutation();

  const onPublishAffectations = useCallback(() => {
    publishAffectations(
      { sessionId },
      {
        onSuccess: () => {
          toasts.success({
            title: formatMessage({ defaultMessage: 'Session publiée avec succès' }),
          });
        },

        onError: () => {
          toasts.error({
            title: formatMessage({ defaultMessage: 'Erreur lors de la publication des affectations' }),
          });
        },
      },
    );
  }, [formatMessage, publishAffectations, sessionId, toasts]);

  if (!canManage || (history?.status !== 'NEVER_PUBLISHED' && history?.status !== 'UNPUBLISHED_CHANGES')) {
    return null;
  }

  return (
    <Button
      className="min-h-9! py-1.5!"
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
