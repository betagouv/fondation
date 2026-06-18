import { Outlet, useLocation, useParams } from 'react-router';

import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';

export const MemberLayout = () => {
  const params = useParams();
  const { pathname } = useLocation();

  const isReportOverview = !!params.id;

  let children = (
    <PageContentLayout fullBackgroundOrange={isReportOverview}>
      <Outlet />
    </PageContentLayout>
  );

  if (pathname.includes('observations')) {
    children = <Outlet />;
  }

  return <AuthGuard authorizedRoles={AUTHORIZED_ROLES.MEMBER}>{children}</AuthGuard>;
};
