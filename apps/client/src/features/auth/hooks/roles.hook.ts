import { useMemo } from 'react';
import { useLocation } from 'react-router';

import type { RoleEnum } from '@/shared/enums/role.enum';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

function useHasRoles(...roles: readonly RoleEnum[]): boolean | null {
  const { user } = useUser();
  return useMemo(() => (user ? roles.includes(user.role as RoleEnum) : null), [user, roles]);
}

export function useIsSg(): boolean {
  const isSg = useHasRoles('ADJOINT_SECRETAIRE_GENERAL', 'ADMIN');
  return isSg ?? false;
}

export function useIsAdmin(): boolean {
  const isAdmin = useHasRoles('ADMIN');
  return isAdmin ?? false;
}

/** returns the current role, depending on the current route. */
export function useIsSgNavigation(): boolean {
  const { pathname } = useLocation();
  return useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);
}
