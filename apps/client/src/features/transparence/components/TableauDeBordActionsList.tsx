import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import React from 'react';

import { useAlerts } from '@/shared/context/alerts';
import {
  useDetailedNominationSessionAffectationsVersionQuery,
  usePublishVersionMutation,
} from '@queries/nomination-sessions.queries';

import { DocGenerationAction } from './DocGenerationAction';

export function TableauDeBordActionList(props: { className?: string; sessionId: string }) {
  const alerts = useAlerts();

  const { mutate: publishAffectations, isPending: isPublishing } = usePublishVersionMutation();

  const { data: metadata } = useDetailedNominationSessionAffectationsVersionQuery(props.sessionId);

  const { isDraft, hasNoVersionYet } = React.useMemo(
    () => ({
      hasNoVersionYet: metadata?.version === 0,
      isDraft: metadata && 'status' in metadata && metadata.status === 'BROUILLON',
    }),
    [metadata],
  );

  const onPublishAffectations = React.useCallback(() => {
    publishAffectations(
      { sessionId: props.sessionId },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: 'Session publiée avec succès',
          });
        },

        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: 'Erreur lors de la publication des affectations',
          });
        },
      },
    );
  }, [publishAffectations, alerts, props]);

  return (
    <ul
      className={clsx(
        'fr-m-0 fr-p-0 flex list-none flex-row-reverse flex-wrap items-center gap-4',
        props.className,
      )}
    >
      {(isDraft || hasNoVersionYet) && (
        <li>
          <Button
            size="small"
            priority="primary"
            iconId="ri-megaphone-fill"
            onClick={onPublishAffectations}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publication en cours...' : 'Publier aux membres'}
          </Button>
        </li>
      )}

      <DocGenerationAction sessionId={props.sessionId} />
    </ul>
  );
}
