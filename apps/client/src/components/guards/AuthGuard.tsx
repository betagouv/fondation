import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { useValidateSessionFromCookie } from '../../queries/validate-session-from-cookie.query';
import type { Role } from 'shared-models';

interface AuthGuardProps {
  children: React.ReactNode;
  authorizedRoles: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, authorizedRoles }) => {
  const navigate = useNavigate();
  const { user, isPending, isError } = useValidateSessionFromCookie();

  useEffect(() => {
    if (!isPending && (!user || isError)) {
      navigate(ROUTE_PATHS.LOGIN, { replace: true });
    }
  }, [user, isPending, isError, navigate]);

  if (isPending) {
    return null;
  }

  if (!user || isError) {
    return null;
  }

  if (!authorizedRoles.includes(user.role as Role)) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  return <>{children}</>;
};
