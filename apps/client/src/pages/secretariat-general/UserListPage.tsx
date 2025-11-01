import { MemberList } from '../../components/secretariat-general/membres/list/MemberList';
import { MemberListHeader } from '../../components/secretariat-general/membres/list/MemberListHeader';
import { PageContentLayout } from '../../components/shared/PageContentLayout';

export function UserListPage() {
  return (
    <PageContentLayout>
      <MemberListHeader />
      <MemberList />
    </PageContentLayout>
  );
}
