import { Outlet } from 'react-router';

import { PageLayout } from './components/layout/PageLayout';

export const HomePage = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default HomePage;
