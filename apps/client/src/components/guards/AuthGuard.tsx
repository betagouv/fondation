import { Navigate } from 'react-router';

import { useUser } from '@queries/auth.queries';

import { ROUTE_PATHS } from '../../utils/route-path.utils';

interface AuthGuardProps {
  children: React.ReactNode;
  authorizedRoles: readonly unknown[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, authorizedRoles }) => {
  const { user, isFetching } = useUser();

  if (isFetching) return null;
  if (user && authorizedRoles.includes(user.role)) return children;

  return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
};
