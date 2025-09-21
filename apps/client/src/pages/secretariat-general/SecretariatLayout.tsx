import { Outlet } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '../../constants/authorized-roles.constants';

export const SecretariatGeneralLayout = () => (
  <AuthGuard authorizedRoles={AUTHORIZED_ROLES.SG}>
    <Outlet />
  </AuthGuard>
);
