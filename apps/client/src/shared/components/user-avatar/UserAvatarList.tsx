import Badge from '@codegouvfr/react-dsfr/Badge';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';

import { userAvatarSizes } from './user-avatar.utils';
import { UserAvatar } from './UserAvatar';

export function UserAvatarList(props: {
  size?: 'sm' | 'md' | 'lg';
  max?: number;
  direction?: 'row' | 'col';
  users: readonly { firstName: string; lastName: string }[];
  enableTooltip?: false;
}) {
  const intl = useIntl();
  if (props.users.length === 0) return null;

  const users = props.users.toSorted((a, b) => a.lastName.localeCompare(b.lastName));
  const max = props.max ?? 3;
  const content = (
    <ul
      className={clsx(
        'fr-m-0 fr-p-0 flex cursor-pointer list-none items-center gap-x-2',
        (props.direction ?? 'row') === 'row' ? 'flex-row' : 'flex-col',
      )}
    >
      {(users.length > max ? users.slice(0, max) : users).map((user) => (
        <li className="fr-p-0" key={`${user.firstName} ${user.lastName}`}>
          <UserAvatar user={user} size={props.size} enableTooltip={false} />
        </li>
      ))}
      {users.length > max ? (
        <li className="fr-p-0">
          <Badge
            noIcon
            small={props.size === 'sm'}
            className={clsx(
              'rounded-full bg-(--background-default-grey-active)! text-(--text-default-grey)!',
              userAvatarSizes[props.size ?? 'md'],
            )}
          >
            +{users.length - max}
          </Badge>
        </li>
      ) : null}
    </ul>
  );

  const tooltipTitle = intl.formatList(users.map(memberFullName), { type: 'conjunction' });
  return props.enableTooltip !== false ? <Tooltip title={tooltipTitle}>{content}</Tooltip> : content;
}
