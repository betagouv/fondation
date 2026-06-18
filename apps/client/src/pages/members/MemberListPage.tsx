import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { MemberList } from '@/features/members/components/MemberList';
import { MemberListHeader } from '@/features/members/components/MemberListHeader';

export function MemberListPage() {
  return (
    <PageContentLayout>
      <MemberListHeader />
      <MemberList />
    </PageContentLayout>
  );
}
