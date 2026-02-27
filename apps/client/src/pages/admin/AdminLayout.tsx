import { AuthGuard } from '@/components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { Outlet } from 'react-router';

export function AdminLayout() {
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.NONE}>
      <Outlet />
    </AuthGuard>
  );
}
