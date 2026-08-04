import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';

export function NominationFilesAffectationsStatus() {
  const { sessionId, isEditable } = useNominationFilesTable();
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(sessionId);

  if (!isEditable) return null;

  const isBrouillon =
    !affectationsVersion || !('status' in affectationsVersion) || affectationsVersion.status !== 'PUBLIEE';
  return (
    <Badge className="rounded-full" noIcon severity={isBrouillon ? 'info' : 'success'}>
      {isBrouillon ? (
        <FormattedMessage defaultMessage="Brouillon" />
      ) : (
        <FormattedMessage defaultMessage="Publiée" />
      )}
    </Badge>
  );
}
