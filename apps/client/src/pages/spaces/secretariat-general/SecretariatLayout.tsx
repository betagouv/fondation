import { Outlet } from 'react-router';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';

export const SecretariatGeneralLayout = () => (
  <AuthGuard authorizedRoles={AUTHORIZED_ROLES.SG}>
    <Outlet />
  </AuthGuard>
);
