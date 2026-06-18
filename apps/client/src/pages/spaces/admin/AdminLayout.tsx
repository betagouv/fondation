import { Outlet } from 'react-router';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';

export function AdminLayout() {
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.NONE}>
      <Outlet />
    </AuthGuard>
  );
}
