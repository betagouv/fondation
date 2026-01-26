import { Outlet, useLocation, useParams } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { PageContentLayout } from '../../components/shared/PageContentLayout';
import { AUTHORIZED_ROLES } from '../../constants/authorized-roles.constants';

export const TransparencesLayout = () => {
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
