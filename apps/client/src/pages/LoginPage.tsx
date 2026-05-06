import { Navigate, useLocation } from 'react-router';

import Login from '@/components/login/Login';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export const LoginPage = () => {
  const location = useLocation();
  const { user, isLoading, isFetched, isError } = useUser();

  if (isLoading) {
    return null;
  }

  if (isError || (isFetched && !user)) {
    if (location.pathname != ROUTE_PATHS.LOGIN) {
      return <Navigate replace to={ROUTE_PATHS.LOGIN} />;
    }

    return <Login />;
  }

  if (AUTHORIZED_ROLES.MEMBER.includes(user?.role)) {
    return <Navigate to={ROUTE_PATHS.TRANSPARENCES.DASHBOARD} />;
  }

  return <Navigate to={ROUTE_PATHS.SG.DASHBOARD} />;
};
