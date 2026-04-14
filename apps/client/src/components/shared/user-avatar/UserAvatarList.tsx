import { toFullName } from '@/utils/user.utils';
import Badge from '@codegouvfr/react-dsfr/Badge';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';
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
        'm-0 flex cursor-pointer list-none items-center gap-x-2 p-0',
        (props.direction ?? 'row') === 'row' ? 'flex-row' : 'flex-col'
      )}
    >
      {(users.length > max ? users.slice(0, max) : users).map((user) => (
        <li className="p-0" key={`${user.firstName} ${user.lastName}`}>
          <UserAvatar user={user} size={props.size} enableTooltip={false} />
        </li>
      ))}
      {users.length > max ? (
        <li className="p-0">
          <Badge
            noIcon
            small={props.size === 'sm'}
            severity="info"
            className={clsx(`rounded-full`, userAvatarSizes[props.size ?? 'md'])}
          >
            +{users.length - max}
          </Badge>
        </li>
      ) : null}
    </ul>
  );

  const tooltipTitle = intl.formatList(users.map(toFullName), { type: 'conjunction' });
  return props.enableTooltip !== false ? <Tooltip title={tooltipTitle}>{content}</Tooltip> : content;
}
