import React from 'react';
import { useLocation } from 'react-router';

import type { RoleEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

/** returns the current user role */
function useHasRole(role: RoleEnum): boolean {
  const { user } = useUser();
  return React.useMemo(() => user?.role === role, [user, role]);
}

export function useIsSg(): boolean {
  return useHasRole('ADJOINT_SECRETAIRE_GENERAL');
}

export function useIsAdmin(): boolean {
  return useHasRole('ADMIN');
}

/** returns the current role, depending on the current route. */
export function useIsSgNavigation(): boolean {
  const { pathname } = useLocation();
  return React.useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);
}
