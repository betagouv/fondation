import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { AuditionDateForm } from './AuditionDateForm';

export const AUDITION_SECTION_ID = 'magistrat-audition-section';

export function AuditionDate(props: { editable: boolean; nominationFile: SessionNominationFile }) {
  const { editable, nominationFile } = props;
  const { sessionId } = useNominationFilesTable();

  if (!editable && !nominationFile.auditionDate) {
    // shown to the secretariat only, which is told why it can no longer schedule one
    return (
      <div id={AUDITION_SECTION_ID}>
        <h3 className="fr-mb-4v text-xl font-semibold">
          <FormattedMessage defaultMessage="Audition" />
        </h3>
        <p className="fr-mb-0 text-(--text-mention-grey)">
          {nominationFile.content.lockedReason === 'ARCHIVED_SESSION' ? (
            <FormattedMessage defaultMessage="La session est archivée : aucune audition ne peut plus être programmée." />
          ) : (
            <FormattedMessage defaultMessage="Une issue définitive a été renseignée pour ce dossier : aucune audition ne peut plus être programmée." />
          )}
        </p>
      </div>
    );
  }

  return (
    <div id={AUDITION_SECTION_ID}>
      <AuditionDateForm
        editable={editable}
        initialAuditionDate={nominationFile.auditionDate}
        initialAuditionTime={nominationFile.auditionTime}
        sessionId={sessionId}
        target={{ nominationFileId: nominationFile.id, type: 'NOMINATION_FILE' }}
      />
    </div>
  );
}
