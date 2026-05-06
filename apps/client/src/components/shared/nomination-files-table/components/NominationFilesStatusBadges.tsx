import Badge from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';

import { useNominationFilesTable } from '../contexts/files-table.context';
import { useNominationFilesStatusCountsQuery } from '@queries/nomination-sessions.queries';

export function NominationFilesStatusBadges(props: { className?: string }) {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: counts } = useNominationFilesStatusCountsQuery({ sessionId });

  if (!counts || !isEditable) return null;

  const { unaffected, inProgress, withOutcome } = counts;
  const total = unaffected + inProgress + withOutcome;

  return (
    <div className={clsx('flex gap-4', props.className)}>
      <Badge noIcon>Total : {total}</Badge>
      <Badge severity="warning" noIcon>
        À affecter : {unaffected}
      </Badge>
      <Badge severity="info" noIcon>
        En cours : {inProgress}
      </Badge>
      <Badge severity="success" noIcon>
        Issue renseignée : {withOutcome}
      </Badge>
    </div>
  );
}
