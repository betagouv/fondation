import { PageContentLayout } from '../../components/shared/PageContentLayout';
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
