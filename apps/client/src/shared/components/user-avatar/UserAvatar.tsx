import { colors } from '@codegouvfr/react-dsfr';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';

import { toFullName, toInitials } from '@/utils/user.utils';

import { userAvatarSizes } from './user-avatar.utils';

export function UserAvatar(props: {
  size?: 'sm' | 'md' | 'lg';
  enableTooltip?: false;
  user: { firstName: string; lastName: string } | undefined | null;
}) {
  if (!props.user) return null;

  const fullName = toFullName(props.user);
  const firstLetters = toInitials(props.user);

  const content = (
    <div
      style={{ backgroundColor: colors.decisions.text.title.blueFrance.default }}
      className={clsx(
        `rounded-full text-center font-medium text-(--text-inverted-grey)`,
        userAvatarSizes[props.size ?? 'md'],
      )}
    >
      {firstLetters}
    </div>
  );

  return props.enableTooltip !== false ? <Tooltip title={fullName}>{content}</Tooltip> : content;
}
