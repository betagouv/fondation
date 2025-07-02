import { Outlet } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { PageContentLayout } from '../../components/shared/PageContentLayout';

export const TransparencesLayout = () => {
  return (
    <AuthGuard>
      <PageContentLayout>
        <Outlet />
      </PageContentLayout>
    </AuthGuard>
  );
};
