import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import type { DetailedAdminUserDto } from '@api/types';

export function UserStatusBadge(props: { status: DetailedAdminUserDto['status'] }) {
  return props.status === 'ACTIVE' ? (
    <Badge noIcon severity="success" small>
      <FormattedMessage defaultMessage="Activé" />
    </Badge>
  ) : (
    <Badge noIcon small>
      <FormattedMessage defaultMessage="Désactivé" />
    </Badge>
  );
}
