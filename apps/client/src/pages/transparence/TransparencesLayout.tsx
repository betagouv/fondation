import { Outlet, useParams } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { PageContentLayout } from '../../components/shared/PageContentLayout';

export const TransparencesLayout = () => {
  const params = useParams();

  const isReportOverview = !!(
    params.dateTransparence &&
    params.transparency &&
    params.formation &&
    params.id
  );

  return (
    <AuthGuard>
      <PageContentLayout fullBackgroundOrange={isReportOverview}>
        <Outlet />
      </PageContentLayout>
    </AuthGuard>
  );
};
