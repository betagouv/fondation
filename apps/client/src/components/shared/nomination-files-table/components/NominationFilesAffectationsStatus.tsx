import Badge from '@codegouvfr/react-dsfr/Badge';

import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../contexts/files-table.context';

export function NominationFilesAffectationsStatus() {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);

  if (!affectationsVersion || affectationsVersion.version === 0 || !isEditable) return null;

  const isBrouillon = affectationsVersion?.status === 'BROUILLON';
  return (
    <div className={'mb-4 flex flex-col gap-2'}>
      <Badge severity={isBrouillon ? 'info' : 'success'}>{isBrouillon ? 'Brouillon' : 'Publiée'}</Badge>
    </div>
  );
}
