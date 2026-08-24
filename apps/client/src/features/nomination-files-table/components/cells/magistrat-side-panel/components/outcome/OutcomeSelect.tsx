import { FormattedMessage } from 'react-intl';

import { outcomeRequiresComment } from '../../../nomination-file-outcome/nomination-file-outcome.utils';
import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { OutcomeBadge } from '@/shared/components/outcome-badge';
import { Dropdown } from '@/shared/ui/dropdown';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function OutcomeSelect(props: { nominationFile: SessionNominationFile }) {
  const { formation, sessionId, outcomes } = useNominationFilesTable();
  const { waitForOutcomeComment } = useOutcomeCommentDialog();
  const { mutate, reset } = useDefineNominationFileOutcomeMutation({
    nominationFileId: props.nominationFile.id,
    sessionId,
  });

  const current = props.nominationFile.content.outcome?.value ?? null;
  const currentComment = props.nominationFile.content.outcome?.comment ?? null;

  const save = (outcome: NominationFileOutcomeEnum, comment: string | null) => {
    mutate({ comment, outcome }, { onSettled: () => reset() });
  };

  const select = async (next: NominationFileOutcomeEnum | null) => {
    if (next === null) {
      mutate({ comment: null, outcome: null });
      return;
    }

    if (!outcomeRequiresComment(outcomes, next)) {
      save(next, currentComment);
      return;
    }

    const event = await waitForOutcomeComment(next, currentComment);
    if (event.type === 'drop') {
      reset();
      return;
    }

    save(next, event.value);
  };

  const options = outcomes.map(({ value }) => ({
    value,
    label: <OutcomeBadge formation={formation} outcome={value} small={false} />,
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
