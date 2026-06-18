import { FormattedMessage } from 'react-intl';

import { type AdminUserRoleEnum, AdminUserRoleLabel } from '../labels/admin-user-enum';
import type { GenderEnum } from '@/types/enums.types';

export const AdminUserRole = (props: { value: AdminUserRoleEnum; gender?: GenderEnum }) => (
  <FormattedMessage {...AdminUserRoleLabel[props.value]} values={{ gender: props.gender }} />
);
