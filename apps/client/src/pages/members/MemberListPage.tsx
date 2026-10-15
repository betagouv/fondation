import { MemberList } from '@/features/members/components/MemberList';
import { MemberListHeader } from '@/features/members/components/MemberListHeader';

export function MemberListPage() {
  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <MemberListHeader />
      <MemberList />
    </div>
  );
}
