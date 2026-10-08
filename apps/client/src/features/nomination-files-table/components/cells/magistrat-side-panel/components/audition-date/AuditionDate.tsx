import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { useNominationFileAuditionHistoryQuery } from '@queries/auditions.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { AuditionDateForm } from './AuditionDateForm';
import { AuditionRequestToggle } from './AuditionRequestToggle';

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
        // the date goes when the audition is dismissed: the form starts again from what is saved
        key={JSON.stringify([nominationFile.auditionDate, nominationFile.auditionTime])}
        sessionId={sessionId}
        target={{ nominationFileId: nominationFile.id, type: 'NOMINATION_FILE' }}
        withSchedule={nominationFile.auditionRequired}
      >
        <AuditionRequestToggle nominationFile={nominationFile} sessionId={sessionId} />
      </AuditionDateForm>
      {nominationFile.auditionDate && (
        <AuditionScheduleAuthor nominationFileId={nominationFile.id} sessionId={sessionId} />
      )}
    </div>
  );
}

function AuditionScheduleAuthor(props: { nominationFileId: string; sessionId: string }) {
  const dateAndTime = useDateAndTime();
  const { data: history } = useNominationFileAuditionHistoryQuery(props);
  const scheduled = history?.scheduled;

  if (!scheduled) return null;

  return (
    <p className="fr-text--xs fr-mt-2v fr-mb-0 text-(--text-mention-grey)">
      <FormattedMessage
        defaultMessage="La date d'audition a été programmée le {date} à {time}{known, select, yes { par {name}} other {}}"
        values={{
          ...dateAndTime(scheduled.at),
          known: scheduled.by ? 'yes' : 'no',
          name: scheduled.by?.name,
        }}
      />
    </p>
  );
}
