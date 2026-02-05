import React from 'react';
import { useLocation } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

/** returns the current user role */
export function useIsSg(): boolean {
  const { user } = useUser();
  return React.useMemo(() => user?.role === 'ADJOINT_SECRETAIRE_GENERAL', [user]);
}

/** returns the current role, depending on the current route. */
export function useIsSgNavigation(): boolean {
  const { pathname } = useLocation();
  return React.useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);
}
