import Badge from '@codegouvfr/react-dsfr/Badge';

import { useNominationFilesStatusCountsQuery } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../contexts/files-table.context';

export function NominationFilesStatusBadges() {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: counts } = useNominationFilesStatusCountsQuery({ sessionId });

  if (!counts || !isEditable) return null;

  return (
    <div className="flex gap-4">
      <Badge severity="warning" noIcon>
        À affecter : {counts.unaffected}
      </Badge>
      <Badge severity="info" noIcon>
        En cours : {counts.inProgress}
      </Badge>
      <Badge severity="success" noIcon>
        Issue renseignée : {counts.withOutcome}
      </Badge>
    </div>
  );
}
