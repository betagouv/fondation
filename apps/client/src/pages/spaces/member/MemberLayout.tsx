import { Outlet, useLocation, useParams } from 'react-router';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';

export function MemberLayout() {
  const params = useParams();
  const { pathname } = useLocation();

  const isReportOverview = !!params.id;

  let children = (
    <PageContentLayout fullBackgroundOrange={isReportOverview}>
      <Outlet />
    </PageContentLayout>
  );

  if (pathname.includes('observations') || pathname.includes('magistrats')) {
    children = <Outlet />;
  }

  return <AuthGuard authorizedRoles={AUTHORIZED_ROLES.MEMBER}>{children}</AuthGuard>;
}
