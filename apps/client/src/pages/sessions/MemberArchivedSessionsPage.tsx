import { ArchivedSessions } from '@/features/sessions/components/ArchivedSessions';
import { useUser } from '@queries/auth.queries';

export function MemberArchivedSessionsPage() {
  const { user } = useUser();

  return <ArchivedSessions space="TRANSPARENCES" withFormationFilter={!user?.formation} />;
}
