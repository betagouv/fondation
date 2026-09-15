import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { ObservationLinks } from '@/features/observations/components/ObservationLinks';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function ObservantsCell({ nominationFile }: { nominationFile: SessionNominationFile }) {
  const isSg = useIsSgNavigation();
  const { sessionId } = useNominationFilesTable();

  return (
    <ObservationLinks
      sessionId={sessionId}
      context={isSg ? 'sg' : 'membre'}
      nominationFile={{
        ...nominationFile,
        legacyObservers: nominationFile.content.observants ?? [],
        name: nominationFile.content.nomMagistrat,
      }}
    />
  );
}
