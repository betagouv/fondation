import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { UserStatusEnumMessages, type UserStatusEnum } from '@/shared/enums/user-status.enum';

export function UserStatusBadge(props: { status: UserStatusEnum }) {
  return (
    <Badge noIcon severity={props.status === 'ACTIVE' ? 'success' : undefined} small>
      <FormattedMessage {...UserStatusEnumMessages[props.status]} />
    </Badge>
  );
}
