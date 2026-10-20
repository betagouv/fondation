import { defineMessages } from 'react-intl';

import type { DetailedAdminUserDto } from '@api/types';

export type UserStatusEnum = DetailedAdminUserDto['status'];

export const UserStatusEnum = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const satisfies Record<UserStatusEnum, UserStatusEnum>;

export const UserStatusEnumMessages = defineMessages({
  ACTIVE: { defaultMessage: 'Activé' },
  DEACTIVATED: { defaultMessage: 'Désactivé' },
} satisfies Record<UserStatusEnum, { defaultMessage: string }>);
