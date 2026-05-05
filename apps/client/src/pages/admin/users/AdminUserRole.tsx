import type { GenderEnum } from '@/types/enums.types';
import { FormattedMessage } from 'react-intl';
import { type AdminUserRoleEnum, AdminUserRoleLabel } from './admin-user-enum';

export const AdminUserRole = (props: { value: AdminUserRoleEnum; gender?: GenderEnum }) => (
  <FormattedMessage {...AdminUserRoleLabel[props.value]} values={{ gender: props.gender }} />
);
