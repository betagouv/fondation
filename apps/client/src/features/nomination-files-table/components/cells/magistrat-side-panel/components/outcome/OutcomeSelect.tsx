import { FormattedMessage } from 'react-intl';

import { outcomeRequiresComment } from '../../../nomination-file-outcome/nomination-file-outcome.utils';
import { NominationFileOutcomeBadge } from '../../../nomination-file-outcome/NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
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

  const save = (outcome: NominationFileOutcomeEnum, comment: string | null) => {
    mutate({ comment, outcome }, { onSettled: () => reset() });
  };

  const select = async (next: NominationFileOutcomeEnum | null) => {
    if (next === null) {
      mutate({ comment: null, outcome: null });
      return;
    }

    if (!outcomeRequiresComment(outcomes, next)) {
      save(next, null);
      return;
    }

    const event = await waitForOutcomeComment(next);
    if (event.type === 'drop') {
      reset();
      return;
    }

    save(next, event.value);
  };

  const options = outcomes.map(({ value }) => ({
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
