import Card from '@codegouvfr/react-dsfr/Card';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import type { SessionNominationFile } from '@/queries/nomination-sessions.queries';
import { formatDateOnly } from '@/utils/date-only.util';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { fullNameUpperCase } from '@/utils/user.utils';

type ObservationCardProps = {
  context: 'sg' | 'membre';
  nominationFileId: string;
  observation: SessionNominationFile['observations'][number];
  reportId?: string;
  sessionId: string;
};

export function ObservationCard({
  context,
  nominationFileId,
  observation,
  reportId,
  sessionId,
}: ObservationCardProps) {
  const { formatMessage } = useIntl();
  const shouldDisplayCommentIcon = observation.hasDescription || observation.hasUserComment;
  const magistratName = observation.magistrat
    ? fullNameUpperCase(observation.magistrat)
    : formatMessage({ defaultMessage: 'Magistrat inconnu' });

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
        <span className="flex flex-row items-center text-(--text-label-grey)">
          {magistratName}
          {shouldDisplayCommentIcon ? (
            <i className={clsx(cx('ri-message-3-line'), 'fr-ml-1v before:size-5! before:content-[""]')} />
          ) : null}
        </span>
      }
      desc={
        <span className={clsx(cx('fr-mb-0', 'fr-text--light'), 'text-sm')}>
          <FormattedMessage
            defaultMessage="Observation du {date}"
            values={{ date: formatDateOnly(observation.date) }}
          />
        </span>
      }
      linkProps={{ to: linkWithReport }}
      enlargeLink
      size="small"
    />
  );
}
