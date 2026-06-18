import { Outlet } from 'react-router';

import { PageLayout } from '@/layout/PageLayout';

export const HomePage = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default HomePage;
