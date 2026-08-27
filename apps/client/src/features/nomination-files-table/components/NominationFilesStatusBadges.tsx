import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { TotalBadge } from '@/shared/ui/total-badge';
import { useNominationFilesStatusCountsQuery } from '@queries/nomination-sessions.queries';

export function NominationFilesStatusBadges(props: { className?: string }) {
  const { sessionId } = useNominationFilesTable();
  const { data: counts } = useNominationFilesStatusCountsQuery({ sessionId });

  if (!counts) return null;

  const { unaffected, inProgress, withOutcome } = counts;

  return (
    <ul className={clsx('fr-m-0 fr-p-0 flex list-none gap-6', props.className)}>
      <li className="fr-p-0">
        <TotalBadge value={unaffected + inProgress + withOutcome}>
          <FormattedMessage defaultMessage="Total" />
        </TotalBadge>
      </li>
      <li className="fr-p-0">
        <TotalBadge severity="warning" value={unaffected}>
          <FormattedMessage defaultMessage="À affecter" />
        </TotalBadge>
      </li>
      <li className="fr-p-0">
        <TotalBadge severity="info" value={inProgress}>
          <FormattedMessage defaultMessage="En cours" />
        </TotalBadge>
      </li>
      <li className="fr-p-0">
        <TotalBadge severity="success" value={withOutcome}>
          <FormattedMessage
            defaultMessage="{count, plural, one {Issue renseignée} other {Issues renseignées}}"
            values={{ count: withOutcome }}
          />
        </TotalBadge>
      </li>
    </ul>
  );
}
