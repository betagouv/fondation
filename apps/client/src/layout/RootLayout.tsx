import { Outlet } from 'react-router';

import { useMatomoPageTracking } from '@/utils/matomo';

import { PageLayout } from './PageLayout';

export const RootLayout = () => {
  useMatomoPageTracking();

  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};
