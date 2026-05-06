import Badge from '@codegouvfr/react-dsfr/Badge';

import { useNominationFilesTable } from '../contexts/files-table.context';
import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';

export function NominationFilesAffectationsStatus() {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);

  if (!isEditable) return null;

  const isBrouillon =
    !affectationsVersion || !('status' in affectationsVersion) || affectationsVersion.status !== 'PUBLIEE';
  return <Badge severity={isBrouillon ? 'info' : 'success'}>{isBrouillon ? 'Brouillon' : 'Publiée'}</Badge>;
}
