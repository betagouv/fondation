import { FormattedMessage } from 'react-intl';

import { useSortedNominationFileOutcomes } from '../../../nomination-file-outcome/nomination-file-outcome-badge.utils';
import { NominationFileOutcomeBadge } from '../../../nomination-file-outcome/NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useObservationFollowUpReminderModal } from '../../../observation-follow-up/useObservationFollowUpReminderModal.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { SoftDropdown } from '@/shared/ui/soft-dropdown';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

const OPTION_CLASS =
  'fr-px-2v fr-py-1v flex items-center rounded text-left hover:bg-(--background-default-grey-hover)';

export function MagistratOutcomeSelect(props: { nominationFile: SessionNominationFile }) {
  const { formation, sessionId } = useNominationFilesTable();
  const outcomes = useSortedNominationFileOutcomes();
  const { waitForOutcomeComment } = useOutcomeCommentDialog();
  const observationFollowUps = useObservationFollowUpReminderModal();
  const { mutate, reset } = useDefineNominationFileOutcomeMutation({
    nominationFileId: props.nominationFile.id,
    sessionId,
  });

  const current = props.nominationFile.content.outcome?.value ?? null;

  const select = async (next: NominationFileOutcomeEnum | null) => {
    if (next === null) {
      mutate({ comment: null, outcome: null });
      return;
    }

    const event = await waitForOutcomeComment(next);
    if (event.type === 'drop') {
      reset();
      return;
    }

    mutate(
      { comment: event.value, outcome: next },
      {
        onSettled: () => reset(),
        onSuccess: () => observationFollowUps.remindOfObservationFollowUpIfNecessary(props.nominationFile),
      },
    );
  };

  const optionClass = (active: boolean) =>
    `${OPTION_CLASS} ${active ? 'bg-(--background-open-blue-france) font-semibold' : ''}`;

  return (
    <SoftDropdown
      label={
        current ? (
          <NominationFileOutcomeBadge formation={formation} outcome={current} small={false} />
        ) : (
          <span className="text-sm">
            <FormattedMessage defaultMessage="Sélectionner" />
          </span>
        )
      }
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <button
            className={optionClass(current === null)}
            onClick={() => {
              close();
              select(null);
            }}
            type="button"
          >
            <span className="text-sm">
              <FormattedMessage defaultMessage="Aucune" />
            </span>
          </button>
          {outcomes.map((value) => (
            <button
              key={value}
              className={optionClass(current === value)}
              onClick={() => {
                close();
                select(value);
              }}
              type="button"
            >
              <NominationFileOutcomeBadge formation={formation} outcome={value} />
            </button>
          ))}
        </div>
      )}
    </SoftDropdown>
  );
}
