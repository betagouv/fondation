import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { useValidateSessionFromCookie } from '../queries/validate-session-from-cookie.query';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { data, isPending, isError } = useValidateSessionFromCookie();

  useEffect(() => {
    if (isError) {
      navigate(ROUTE_PATHS.LOGIN);
    }
  }, [isError, navigate]);

  if (isPending || isError || !data) {
    return null;
  }

  return <>{children}</>;
};
