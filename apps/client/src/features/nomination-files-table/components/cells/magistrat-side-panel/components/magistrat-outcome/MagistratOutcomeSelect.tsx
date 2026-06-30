import { FormattedMessage } from 'react-intl';

import { useSortedNominationFileOutcomes } from '../../../nomination-file-outcome/nomination-file-outcome-badge.utils';
import { NominationFileOutcomeBadge } from '../../../nomination-file-outcome/NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useObservationFollowUpReminderModal } from '../../../observation-follow-up/useObservationFollowUpReminderModal.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { Dropdown } from '@/shared/ui/dropdown';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

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

  const options = outcomes.map((value) => ({
    value,
    label: <NominationFileOutcomeBadge formation={formation} outcome={value} small={false} />,
  }));

  return (
    <Dropdown
      onSelect={(value) => select(value as NominationFileOutcomeEnum | null)}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={current}
    />
  );
}
