import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratAuditionDateForm } from './MagistratAuditionDateForm';

export const AUDITION_SECTION_ID = 'magistrat-audition-section';

export function MagistratAuditionDate(props: { editable: boolean; nominationFile: SessionNominationFile }) {
  const { editable, nominationFile } = props;
  const { sessionId } = useNominationFilesTable();

  if (!editable && !nominationFile.auditionDate) return null;

  return (
    <div className="flex flex-col gap-2" id={AUDITION_SECTION_ID}>
      <label className="fr-mb-2v block text-xl font-semibold">
        <FormattedMessage defaultMessage="Audition" />
      </label>
      <MagistratAuditionDateForm
        editable={editable}
        initialAuditionDate={nominationFile.auditionDate}
        initialAuditionTime={nominationFile.auditionTime}
        nominationFileId={nominationFile.id}
        sessionId={sessionId}
      />
    </div>
  );
}
