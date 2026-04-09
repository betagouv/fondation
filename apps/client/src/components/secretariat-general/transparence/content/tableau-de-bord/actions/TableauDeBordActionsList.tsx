import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import React from 'react';
import { generatePath } from 'react-router';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';
import {
  useDetailedNominationSessionAffectationsVersionQuery,
  usePublishVersionMutation
} from '@queries/nomination-sessions.queries';

export function TableauDeBordActionList(props: { className?: string; sessionId: string }) {
  const alerts = useAlerts();

  const { mutate: publishAffectations, isPending: isPublishing } = usePublishVersionMutation();

  const { data: docGenerationReadiness } = useIsSessionReadyForDocGenerationQuery({
    sessionId: props.sessionId
  });
  const { data: metadata } = useDetailedNominationSessionAffectationsVersionQuery(props.sessionId);

  const { isDraft, hasNoVersionYet } = React.useMemo(
    () => ({
      hasNoVersionYet: metadata?.version === 0,
      isDraft: metadata && 'status' in metadata && metadata.status === 'BROUILLON'
    }),
    [metadata]
  );

  const docGenerationLinkProps = React.useMemo(
    () => generatePath(ROUTE_PATHS.SG.NEW_AGENDA, { sessionId: props.sessionId }),
    [props.sessionId]
  );

  const onPublishAffectations = React.useCallback(() => {
    publishAffectations(
      { sessionId: props.sessionId },
      {
        onSuccess: () => {
          alerts.pushAlert({
            severity: 'success',
            title: 'Session publiée avec succès'
          });
        },

        onError: () => {
          alerts.pushAlert({
            severity: 'error',
            title: 'Erreur lors de la publication des affectations'
          });
        }
      }
    );
  }, [publishAffectations, alerts, props]);

  if (!isDraft && !hasNoVersionYet && !docGenerationReadiness?.isReady) return null;

  return (
    <ul
      className={clsx(
        'm-0 flex list-none flex-row-reverse flex-wrap items-center gap-4 p-0',
        props.className
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

      {!!docGenerationReadiness?.isReady && (
        <li>
          <Button
            size="small"
            priority="secondary"
            iconId="fr-icon-folder-2-line"
            linkProps={{ to: docGenerationLinkProps }}
          >
            Générer la documentation
          </Button>
        </li>
      )}
    </ul>
  );
}
