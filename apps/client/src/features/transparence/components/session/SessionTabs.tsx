import { useQueryState } from 'nuqs';
import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { LinkTab, LinkTabs } from '@/shared/ui/link-tabs';
import { ROUTE_PATHS, SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';
import { useSessionAuditionsCountsQuery } from '@queries/auditions.queries';
import {
  useListNominationSessionAttachmentsQuery,
  useNominationFilesStatusCountsQuery,
} from '@queries/nomination-sessions.queries';
import { useSessionObservationsCountQuery } from '@queries/observations.queries';

export function MemberSessionTabsBar(props: { sessionId: string }) {
  const { formatMessage } = useIntl();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId: props.sessionId });
  const { data: auditionCounts } = useSessionAuditionsCountsQuery({ sessionId: props.sessionId });

  const params = { sessionId: props.sessionId };
  const attachmentsCount = attachments?.items.length;
  const auditionsCount = auditionCounts && auditionCounts.scheduled + auditionCounts.toSchedule;
  const isSidePanelOpen = openedDossier !== null;

  return (
    <LinkTabs ariaLabel={formatMessage({ defaultMessage: 'Sections de la transparence' })}>
      <LinkTab
        end
        icon="fr-icon-list-unordered"
        label={formatMessage({ defaultMessage: 'Propositions' })}
        to={generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, params)}
      />
      <LinkTab
        count={auditionsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-speak-line"
        label={formatMessage({ defaultMessage: 'Auditions' })}
        to={generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS_AUDITIONS, params)}
      />
      <LinkTab
        count={attachmentsCount}
        disabled={isSidePanelOpen}
        icon="ri-image-line"
        label={formatMessage({ defaultMessage: 'Pièces jointes' })}
        to={generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS_ATTACHMENTS, params)}
      />
    </LinkTabs>
  );
}

export function SessionTabsBar(props: { transparence: DetailedNominationSessionDto }) {
  const { transparence } = props;
  const { formatMessage } = useIntl();
  const [openedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  const { data: docs } = useFindSessionDocsQuery({
    sessionId: transparence.id,
  });
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: transparence.id,
  });
  const { data: fileCounts } = useNominationFilesStatusCountsQuery({
    sessionId: transparence.id,
  });
  const { data: auditionCounts } = useSessionAuditionsCountsQuery({ sessionId: transparence.id });
  const { data: observationsCount } = useSessionObservationsCountQuery({ sessionId: transparence.id });

  const params = { sessionId: transparence.id };

  const propositionsCount = fileCounts?.total;
  const missingEvaluationsCount = fileCounts?.missingEvaluation;
  const auditionsCount = auditionCounts && auditionCounts.scheduled + auditionCounts.toSchedule;
  const docsCount = docs?.items.length;
  const attachmentsCount = attachments?.items.length;
  const isSidePanelOpen = openedDossier !== null;

  return (
    <LinkTabs
      ariaLabel={formatMessage({
        defaultMessage: 'Sections de la transparence',
      })}
    >
      <LinkTab
        count={propositionsCount}
        end
        icon="fr-icon-list-unordered"
        label={formatMessage({ defaultMessage: 'Propositions' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID, params)}
      />
      <LinkTab
        count={observationsCount?.total}
        disabled={isSidePanelOpen}
        icon="fr-icon-chat-3-line"
        label={formatMessage({ defaultMessage: 'Observations' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_OBSERVATIONS, params)}
      />
      <LinkTab
        count={auditionsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-speak-line"
        label={formatMessage({ defaultMessage: 'Auditions' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_AUDITIONS, params)}
      />
      <LinkTab
        count={missingEvaluationsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-draft-line"
        label={formatMessage({ defaultMessage: 'Évaluations manquantes' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_MISSING_EVALUATIONS, params)}
      />
      <LinkTab
        count={docsCount}
        disabled={isSidePanelOpen}
        icon="fr-icon-folder-2-line"
        label={formatMessage({ defaultMessage: 'Documents' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, params)}
      />
      <LinkTab
        count={attachmentsCount}
        disabled={isSidePanelOpen}
        icon="ri-image-line"
        label={formatMessage({ defaultMessage: 'Pièces jointes' })}
        to={generatePath(ROUTE_PATHS.SG.SESSION_ID_ATTACHMENTS, params)}
      />
    </LinkTabs>
  );
}
