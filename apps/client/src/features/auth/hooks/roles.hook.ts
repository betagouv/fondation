import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function useIsSg(): boolean {
  const { user } = useUser();
  return user?.role === 'ADJOINT_SECRETAIRE_GENERAL';
}

export function useIsAdmin(): boolean {
  const { user } = useUser();
  return user?.isAdmin ?? false;
}

/** returns the current role, depending on the current route. */
export function useIsSgNavigation(): boolean {
  const { pathname } = useLocation();
  return useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);
}
