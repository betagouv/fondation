import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import type { DetailedMagistratDto } from '@api/types';

export function MagistratStatusBadge(props: { className?: string; status: DetailedMagistratDto['status'] }) {
  if (props.status === 'ACTIVE') return null;

  return (
    <Badge className={props.className} noIcon small>
      <FormattedMessage defaultMessage="Inactif" />
    </Badge>
  );
}
