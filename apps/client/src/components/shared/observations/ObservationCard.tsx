import Card from '@codegouvfr/react-dsfr/Card';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import type { DetailedReportDto } from '@/generated/api/types';
import { DateOnly } from '@/models/date-only.model';
import type { SessionNominationFile } from '@/queries/nomination-sessions.queries';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';

type ObservationCardProps = {
  observation: DetailedReportDto['observations'][number] | SessionNominationFile['observations'][number];
  sessionId: string;
  nominationFileId: string;
  context: 'sg' | 'membre';
  reportId?: string;
};

export function ObservationCard({
  observation,
  sessionId,
  nominationFileId,
  context,
  reportId,
}: ObservationCardProps) {
  const shouldDisplayCommentIcon = observation.hasDescription || observation.hasUserComment;
  const magistratName = observation.magistrat
    ? `${observation.magistrat.lastName.toUpperCase()} ${capitalize(observation.magistrat.firstName)}`
    : 'Magistrat inconnu';

  const dateObj = 'dateReception' in observation ? observation.dateReception : observation.date;

  const observationPath = getObservationDetailsPath({
    context,
    sessionId,
    nominationFileId,
    observationId: observation.id,
  });
  const linkWithReport = reportId ? `${observationPath}?reportId=${reportId}` : observationPath;

  return (
    <Card
      title={
        <span className="flex flex-row items-center">
          {magistratName}
          {shouldDisplayCommentIcon ? (
            <i className={clsx(cx('ri-message-3-line'), 'ml-1 before:size-5 before:content-[""]')} />
          ) : null}
        </span>
      }
      desc={
        <span className={clsx(cx('fr-mb-0', 'fr-text--light'), 'text-sm')}>
          Observation du {DateOnly.fromDateOnly(dateObj)}
        </span>
      }
      linkProps={{ to: linkWithReport }}
      enlargeLink
      size="small"
    />
  );
}
