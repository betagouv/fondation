import { Outlet } from 'react-router';

import { PageContentLayout } from '@/shared/ui/PageContentLayout';

export function MemberContentLayout() {
  return (
    <PageContentLayout>
      <Outlet />
    </PageContentLayout>
  );
}
