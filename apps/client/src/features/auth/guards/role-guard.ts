import { redirect } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionQueryOptions, type SessionUser } from '@queries/auth.queries';
import { queryClient } from '@queries/query-client';

export function isAuthorized(
  user: { isAdmin: boolean; role: string } | null | undefined,
  authorizedRoles: readonly unknown[],
): boolean {
  return !!user && (user.isAdmin || authorizedRoles.includes(user.role));
}

/** The cached session survives a technical error */
function sessionUser(): Promise<SessionUser | null> {
  return queryClient.ensureQueryData(sessionQueryOptions).catch((error) => {
    const cached = queryClient.getQueryData(sessionQueryOptions.queryKey);
    if (cached === undefined) throw error;
    return cached;
  });
}

export function roleGuard(authorizedRoles: readonly unknown[]) {
  return async () => {
    if (isAuthorized(await sessionUser(), authorizedRoles)) return null;

    return redirect(ROUTE_PATHS.LOGIN);
  };
}

/** A page of the administration that the admin right alone does not open */
export function capabilityGuard(capability: 'canManageApiClients') {
  return async () => {
    const user = await sessionUser();
    if (!user) return redirect(ROUTE_PATHS.LOGIN);

    return user[capability] ? null : redirect(ROUTE_PATHS.ADMIN.USERS);
  };
}
