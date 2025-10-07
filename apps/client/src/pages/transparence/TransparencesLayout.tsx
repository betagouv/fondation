import { Outlet, useParams } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { PageContentLayout } from '../../components/shared/PageContentLayout';
import { AUTHORIZED_ROLES } from '../../constants/authorized-roles.constants';

export const TransparencesLayout = () => {
  const params = useParams();

  const isReportOverview = !!params.id;

  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.MEMBER}>
      <PageContentLayout fullBackgroundOrange={isReportOverview}>
        <Outlet />
      </PageContentLayout>
    </AuthGuard>
  );
};
