import { Outlet } from 'react-router';

import { PageLayout } from './components/layout/PageLayout';
import { useMatomoPageTracking } from './utils/matomo';

export const HomePage = () => {
  useMatomoPageTracking();

  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default HomePage;
