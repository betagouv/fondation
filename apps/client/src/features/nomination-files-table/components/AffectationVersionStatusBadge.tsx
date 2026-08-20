import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';

export function AffectationVersionStatusBadge(props: { sessionId: string }) {
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(props.sessionId);

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
