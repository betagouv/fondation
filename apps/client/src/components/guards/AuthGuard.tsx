import { Navigate } from 'react-router-dom';
import type { Role } from 'shared-models';
import { useUser } from '../../react-query/queries/use-user.queries';
import { ROUTE_PATHS } from '../../utils/route-path.utils';

interface AuthGuardProps {
  children: React.ReactNode;
  authorizedRoles: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, authorizedRoles }) => {
  const { user, isFetching } = useUser();

  if (isFetching) return null;
  if (user && authorizedRoles.includes(user.role)) return children;

  return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
};
