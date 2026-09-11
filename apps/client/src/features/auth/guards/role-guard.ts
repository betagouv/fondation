import { redirect } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionQueryOptions } from '@queries/auth.queries';
import { queryClient } from '@queries/query-client';

export function isAuthorized(
  user: { role: string } | null | undefined,
  authorizedRoles: readonly unknown[],
): boolean {
  return !!user && (user.role === 'ADMIN' || authorizedRoles.includes(user.role));
}

export function roleGuard(authorizedRoles: readonly unknown[]) {
  return async () => {
    const user = await queryClient.ensureQueryData(sessionQueryOptions).catch((error) => {
      const cached = queryClient.getQueryData(sessionQueryOptions.queryKey);
      if (cached === undefined) throw error;
      return cached;
    });

    if (isAuthorized(user, authorizedRoles)) return null;

    return redirect(ROUTE_PATHS.LOGIN);
  };
}
