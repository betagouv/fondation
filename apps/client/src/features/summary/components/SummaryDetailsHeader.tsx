import { FormattedMessage, useIntl } from 'react-intl';
import { type To, useLocation, useNavigate } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { transparencyToLabel } from '@/features/transparence/labels/labels-mappers';
import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { PriorityBadge } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { openedDossierSearch, ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { SummaryReaderSelector } from './SummaryReaderSelector';

export function SummaryDetailsHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const isSg = useIsSg();
  const { nominationFileId, sessionId, summary } = useSummary();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const sessionPath = {
    pathname: isSg
      ? ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', sessionId)
      : ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS.replace(':sessionId', sessionId),
    search: openedDossierSearch(nominationFileId),
  };

  const segments: { label: string; to: To }[] = isSg
    ? [
        { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
        { label: formatMessage({ defaultMessage: 'Gérer une session' }), to: ROUTE_PATHS.SG.MANAGE_SESSION },
      ]
    : [
        {
          label: formatMessage({ defaultMessage: 'Transparences' }),
          to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        },
        {
          label: formatMessage({ defaultMessage: 'Pouvoir de proposition du garde des Sceaux' }),
          to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        },
      ];

  if (session) {
    segments.push({
      label: isSg ? session.name : transparencyToLabel(session.name, session.date),
      to: sessionPath,
    });
  }

  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const hasPreviousPage = location.key !== 'default';
    if (hasPreviousPage) {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <DetailsHeader
      action={<SummaryReaderSelector priority="secondary" rounded={false} />}
      backTo={sessionPath}
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage(
            { defaultMessage: "Fil d'Ariane de la synthèse de {name}" },
            { name: summary.name },
          )}
          breadcrumb={{ currentPageLabel: formatMessage({ defaultMessage: 'Synthèse' }), segments }}
          className="fr-mt-0"
          id="summary-breadcrumb"
        />
      }
      onBackClick={goBack}
      overline={<FormattedMessage defaultMessage="Synthèse" />}
      title={
        <TitleNameIcons name={summary.name}>
          {summary.priorities.length > 0 && (
            <span className="fr-ml-2v fr-mr-3v inline-flex items-center gap-2">
              {[...new Set(summary.priorities)].sort().map((priority) => (
                <PriorityBadge key={priority} priority={priority} />
              ))}
            </span>
          )}
          <DetailsLink context={isSg ? 'sg' : 'membre'} magistratId={summary.detectedMagistratId} small />
          <LolfiLink name={summary.name} nominationFileId={nominationFileId} sessionId={sessionId} small />
        </TitleNameIcons>
      }
    />
  );
}
