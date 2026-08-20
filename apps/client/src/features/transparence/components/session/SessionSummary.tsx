import Badge from '@codegouvfr/react-dsfr/Badge';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { formatFileSize } from '@/utils/file.utils';
import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';

export function SessionStatusBadge(props: { sessionId: string }) {
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

export function SessionCount(props: { children: ReactNode; count: number }) {
  return (
    <p className="fr-m-0 flex items-center gap-2 text-sm">
      {props.children}
      <Badge as="span" noIcon small>
        {props.count}
      </Badge>
    </p>
  );
}

export function SessionSize(props: { children: ReactNode; sizeInBytes: number }) {
  return (
    <p className="fr-m-0 flex items-center gap-2 text-sm">
      {props.children}
      <Badge as="span" className="normal-case" noIcon small>
        {props.sizeInBytes > 0 ? formatFileSize(props.sizeInBytes) : 0}
      </Badge>
    </p>
  );
}
