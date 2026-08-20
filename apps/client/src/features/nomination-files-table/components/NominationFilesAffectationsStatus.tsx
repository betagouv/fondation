import { useNominationFilesTable } from '../context/files-table.context';
import { SessionStatusBadge } from '@/features/transparence/components/session/SessionSummary';

export function NominationFilesAffectationsStatus() {
  const { sessionId } = useNominationFilesTable();

  return <SessionStatusBadge sessionId={sessionId} />;
}
