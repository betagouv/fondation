import { Navigate, useLocation } from 'react-router-dom';

import { useUser } from '@queries/auth.queries';

import Login from '@/components/login/Login';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export const LoginPage = () => {
  const location = useLocation();
  const { user, isPending, isFetched, isError } = useUser();

  if (isPending) {
    return null;
  }

  if (isError || (isFetched && !user)) {
    if (location.pathname != ROUTE_PATHS.LOGIN) {
      return <Navigate replace to={ROUTE_PATHS.LOGIN} />;
    }

    return <Login />;
  }

  if (AUTHORIZED_ROLES.SG.includes(user?.role)) {
    return <Navigate to={ROUTE_PATHS.SG.DASHBOARD} />;
  }

  return <Navigate to={ROUTE_PATHS.TRANSPARENCES.DASHBOARD} />;
};
