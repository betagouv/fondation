import { MemberList } from '@/features/members/components/MemberList';
import { MemberListHeader } from '@/features/members/components/MemberListHeader';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';

export function MemberListPage() {
  return (
    <PageContentLayout>
      <MemberListHeader />
      <MemberList />
    </PageContentLayout>
  );
}
