import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import { memberFullName, toInitials } from '@/utils/user.utils';

import { userAvatarSizes } from './user-avatar.utils';

export function UserAvatar(props: {
  size?: 'sm' | 'md' | 'lg';
  enableTooltip?: false;
  user: { firstName: string; lastName: string } | undefined | null;
}) {
  if (!props.user) return null;

  const fullName = memberFullName(props.user);
  const firstLetters = toInitials(props.user);

  const content = (
    <div
      className={clsx(
        'rounded-full bg-(--background-default-grey-active) text-center font-medium text-(--text-default-grey)',
        userAvatarSizes[props.size ?? 'md'],
      )}
    >
      {firstLetters}
    </div>
  );

  return props.enableTooltip !== false ? <Tooltip title={fullName}>{content}</Tooltip> : content;
}
