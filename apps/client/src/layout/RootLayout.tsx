import { Outlet } from 'react-router';

import { PageLayout } from './PageLayout';

export const RootLayout = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};
