import { Outlet } from 'react-router';

import { PageContentLayout } from '@/shared/ui/PageContentLayout';

export function MemberReportOverviewLayout() {
  return (
    <PageContentLayout fullBackgroundOrange>
      <Outlet />
    </PageContentLayout>
  );
}
