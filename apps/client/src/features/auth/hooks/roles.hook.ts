import React from 'react';
import { useLocation } from 'react-router';

import type { RoleEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

function useHasRoles(...roles: readonly RoleEnum[]): boolean | null {
  const { user } = useUser();
  return React.useMemo(() => (user ? roles.includes(user.role as RoleEnum) : null), [user, roles]);
}

/** @param strict waits for user to be available. When not available returns null */
export function useIsSg(): boolean;
export function useIsSg(strict: true): boolean | null;
export function useIsSg(strict?: true): boolean | null {
  const isSg = useHasRoles('ADJOINT_SECRETAIRE_GENERAL', 'ADMIN');
  return strict ? isSg : (isSg ?? false);
}

export function useIsAdmin(): boolean {
  const isAdmin = useHasRoles('ADMIN');
  return isAdmin ?? false;
}

/** returns the current role, depending on the current route. */
export function useIsSgNavigation(): boolean {
  const { pathname } = useLocation();
  return React.useMemo(() => pathname.includes(ROUTE_PATHS.SG.DASHBOARD), [pathname]);
}
