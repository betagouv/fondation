import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { AuditionDateForm } from './AuditionDateForm';

export const AUDITION_SECTION_ID = 'magistrat-audition-section';

export function AuditionDate(props: { editable: boolean; nominationFile: SessionNominationFile }) {
  const { editable, nominationFile } = props;
  const { sessionId } = useNominationFilesTable();

  if (!editable && !nominationFile.auditionDate) return null;

  return (
    <div id={AUDITION_SECTION_ID}>
      <AuditionDateForm
        editable={editable}
        initialAuditionDate={nominationFile.auditionDate}
        initialAuditionTime={nominationFile.auditionTime}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
    </div>
  );
}
