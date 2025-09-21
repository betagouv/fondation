import { Navigate } from 'react-router-dom';
import Login from '../components/login/Login';
import { AUTHORIZED_ROLES } from '../constants/authorized-roles.constants';
import { useValidateSessionFromCookie } from '../react-query/queries/validate-session-from-cookie.query';
import { ROUTE_PATHS } from '../utils/route-path.utils';

export const LoginPage = () => {
  const { user, isPending, isError } = useValidateSessionFromCookie();

  if (isPending) {
    return null;
  }

  if (isError || !user) {
    return <Login />;
  }

  if (AUTHORIZED_ROLES.SG.includes(user.role)) {
    return <Navigate to={ROUTE_PATHS.SG.DASHBOARD} />;
  } else if (AUTHORIZED_ROLES.MEMBER.includes(user.role)) {
    return <Navigate to={ROUTE_PATHS.TRANSPARENCES.DASHBOARD} />;
  }

  return <Navigate to={ROUTE_PATHS.TRANSPARENCES.DASHBOARD} />;
};
